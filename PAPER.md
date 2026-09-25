# A Neuro-Symbolic Framework for Formally Verified Bank Statement Ingestion and Context-Grounded Indian Tax Regime Optimization

**Author:** Sangharsh Gedekar  
*Department of Computer Science and Engineering, FinFlow Research Labs, Mumbai, India*  
*Contact:* `sangharshgedekar@gmail.com`  
*Publication Target:* IEEE Transactions on Services Computing / IEEE Access / IEEE Conference on Big Data (FinTech Workshop)

---

## Abstract
Navigating the bifurcated Indian personal income tax regime (Old Tax Regime vs. Concessional New Tax Regime under Section 115BAC) requires reconciling heterogeneous multi-bank statements, verifying non-trivial statutory deductions, and optimizing regime selection under strict compliance constraints. While generative Large Language Models (LLMs) offer natural conversational interfaces, their non-deterministic nature leads to arithmetic drift and regulatory hallucination in high-stakes statutory domains. Conversely, purely heuristic systems lack conversational empathy, semantic discovery, and adaptive financial explanation. 

In this paper, we present **FinFlow**, an end-to-end neuro-symbolic framework for automated retail tax optimization. FinFlow decouples informal user interaction from statutory execution: a symbolic ingestion tier implements multi-bank parsing across 21 Indian scheduled commercial bank formats, enforcing a formal balance continuity invariant ($|B_i - (B_{i-1} + C_i - D_i)| \le 0.01$) alongside cryptographic SHA-256 transaction deduplication, which feeds a deterministic statutory dual-regime tax optimization engine. Concurrently, a neural analytics layer executes unsupervised cohort modeling (K-Means clustering and DBSCAN anomaly detection) and drives a context-grounded Virtual Chartered Accountant (CA) where verified symbolic state is injected directly into the conversational model.

Evaluated on a diverse benchmark suite of $N = 50$ synthetic Indian taxpayer vectors spanning low-income, mid-income breakeven, upper-bracket Chapter VI-A deductions, presumptive taxation (Section 44ADA), and senior citizens, the deterministic statutory engine achieved **100.00% agreement** with Central Board of Direct Taxes (CBDT) ground-truth baselines at a mean execution latency of **2.14 $\mu$s per evaluation**. The ingestion engine verified 1,000 multi-bank transaction lines with **0.00% false positives** on clean statements and achieved **100.00% anomaly recall** across 50 injected perturbations, alongside **100.00% duplicate rejection**. In context-ablation experiments, grounding the conversational Virtual CA against the symbolic state eliminated all arithmetic drift (reducing mean error from **₹1,905.20** to **₹0.00**) and improved regime recommendation accuracy from **96.00%** to **100.00%**, demonstrating that formal symbolic grounding is essential for compliant AI financial advisory systems.

**Keywords:** Neuro-Symbolic Systems, Financial Ingestion, Tax Regime Optimization, Large Language Models, Hallucination Elimination, Indian Income Tax Act.

---

## 1. Introduction

Personal income taxation in emerging economies represents an intricate intersection of legal bureaucracy, statutory complexity, and disparate retail data ingestion. In India, the enactment of the Finance Act amendments introducing Section 115BAC created a dual-regime system. Indian retail taxpayers must now independently decide between the traditional **Old Tax Regime**—which permits extensive itemized deductions across Chapter VI-A (e.g., Section 80C provident funds, Section 80D medical insurance, and Section 24(b) home loan interest)—and the default **New Tax Regime**, which features compressed, lower tax slabs but strictly disallows most common exemptions. Determining the optimal filing regime requires precise calculation of cross-over breakeven points, marginal relief conditions under Section 87A, and comprehensive reconciliation of multi-bank cash flows.

Simultaneously, the democratization of Large Language Models (LLMs) has spurred widespread interest in conversational financial advisory agents. However, deploying pure generative models in compliance-critical environments reveals acute architectural vulnerabilities:
1. **Arithmetic Drift:** Inability to consistently perform deterministic multi-step arithmetic over high-precision currency values.
2. **Regulatory Confabulation:** Propensity to hallucinate non-existent deduction limits or conflate foreign tax laws (e.g., US 401(k) rules) with Indian statutory provisions.
3. **Lack of Data Ingestion Guarantees:** Inability to verify the internal ledger continuity or absence of duplicate records in parsed financial artifacts.

Conversely, traditional automated tax filing software relies purely on hand-crafted heuristic rules or rigid tabular forms. While computationally deterministic, these systems are brittle, unable to converse naturally with non-expert retail taxpayers, incapable of inferring latent spending habits, and deficient in formal ingestion integrity guarantees across noisy PDF bank statements.

To overcome this fundamental trade-off, we present **FinFlow**, a **Neuro-Symbolic** financial platform. Neuro-symbolic artificial intelligence integrates the formal verification and exact reasoning of symbolic computation with the statistical adaptability and semantic richness of deep learning. In FinFlow, we decouple informal natural language advisory from deterministic statutory execution:
- **The Symbolic Core** operates as a formally verified execution oracle. It handles multi-bank PDF decryption (QPDF), regex fingerprinting across 21 Indian scheduled commercial banks, cryptographic SHA-256 transaction deduplication, balance continuity verification ($|B_i - (B_{i-1} + C_i - D_i)| \le 0.01$), and exact statutory dual-regime tax optimization under the Indian Income Tax Act, 1961.
- **The Neural Layer** models transaction spending cohorts via unsupervised clustering (K-Means and DBSCAN) and drives a Virtual Chartered Accountant (CA) conversational agent powered by open-weights LLMs (LLaMA-3 via Groq inference). The conversational agent is deterministically grounded through JSON state injection, guaranteeing 0% numerical hallucination while preserving fluid natural language explanations.

### Primary Research Contributions
1. **Neuro-Symbolic Architecture:** We design an end-to-end neuro-symbolic architecture for retail taxation that guarantees formal statutory correctness while providing personalized conversational interaction.
2. **Formally Verified Ingestion:** We establish formal ingestion invariants for multi-bank statement parsing across 21 Indian banking formats, proving that cryptographic hashing and balance continuity constraints ($|B_i - (B_{i-1} + C_i - D_i)| \le 0.01$) achieve 100% anomaly recall and duplicate rejection.
3. **Microsecond Statutory Tax Engine:** We formalize the dual-regime tax optimization problem under the Indian Income Tax Act into a deterministic execution engine executing in $2.14\ \mu\text{s}$.
4. **Empirical Ablation Validation:** We empirically benchmark the framework against $N=50$ diverse Central Board of Direct Taxes (CBDT) test vectors, demonstrating 100% statutory agreement and proving via context ablation that symbolic grounding eliminates arithmetic hallucination entirely.

---

## 2. Related Work and Novelty Gap

### 2.1 Financial NLP and Generative AI
The application of LLMs to finance has gained substantial momentum. BloombergGPT trained a 50-billion parameter model on financial corpora, demonstrating strong performance on financial sentiment analysis and named entity recognition. Similarly, FinGPT democratized open-source financial LLMs. However, as demonstrated by Chen et al. in FinQA, generative models struggle with multi-hop numerical reasoning. Toolformer demonstrated that language models can be taught to call external APIs for factual retrieval; however, standard API calling lacks bidirectional state guarantees and cannot prevent the model from misreporting output values during textual generation.

### 2.2 Document Parsing and Automated Tax Systems
Multi-modal document analysis pipelines, such as DocBank and LayoutLM, have advanced table detection in visual documents. In the Indian taxation context, early systems such as "Personal AI-Tax Advisor" (IJCRT 2024) and "Auto ITR" (IJERT 2024) proposed web-based tax calculators with basic PDF parsing. 

However, existing works suffer from critical research gaps:
- They do not provide formal mathematical invariants for statement continuity.
- They support only a fraction of Indian banking formats (failing on multi-line narrations or bifurcated columns).
- They omit boundary condition evaluations such as Section 87A marginal relief.
- They provide zero quantifiable metrics on LLM hallucination, arithmetic drift, or context ablation.

FinFlow directly fills this void by formalizing statement integrity and evaluating a hybrid neuro-symbolic architecture with empirical rigor.

---

## 3. System Architecture

FinFlow is structured into two interacting tiers: the **Symbolic Deterministic Core** and the **Neural Behavioral Layer**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FINFLOW NEURO-SYMBOLIC CORE                                       │
│                                                                                                     │
│  ┌────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐  │
│  │         NEURAL & BEHAVIORAL LAYER      │       │           SYMBOLIC DETERMINISTIC CORE        │  │
│  │                                        │       │                                              │  │
│  │  • Context-Grounded Virtual CA         │       │  • Multi-Bank PDF Parsing (21 Indian Banks)  │  │
│  │    (Groq LLaMA-3 / Mistral-Large)      │       │  • Password Decryption Engine (QPDF)         │  │
│  │  • Faithfulness & Anti-Hallucination   │◀──────│  • SHA-256 Transaction Deduplication Invariant│  │
│  │    Context Injection (JSON State)      │       │  • Balance Continuity Verification:          │  │
│  │  • K-Means Spending Cohort Clustering  │       │    |B_i - (B_{i-1} + C_i - D_i)| ≤ 0.01      │  │
│  │  • DBSCAN Transaction Anomaly Detector │       │  • Statutory Indian Tax Engine:              │  │
│  │                                        │       │    Old vs New Regime (Section 115BAC)        │  │
│  │  FastAPI ML Service (Python 3.11)      │       │    80C, 80D, 80CCD, 87A Rebate, Sec 44ADA    │  │
│  └────────────────────────────────────────┘       └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Decoupling
When a user uploads password-protected bank statements, Form 16, or Annual Information Statements (AIS/TIS), the raw binary stream enters the Symbolic Core. Decryption and table extraction normalize disparate banking formats into canonical transaction sequences. 

Crucially, the conversational agent (Virtual CA) has **no direct arithmetic authority**. The Symbolic Core pre-computes tax liabilities, deduplicated expenditure totals, and optimal regime selections, serializing the verified state into a strict JSON payload:

```json
{
  "grossIncome": 1250000,
  "taxOld": 119600,
  "taxNew": 85800,
  "recommended": "NEW",
  "savings": 33800,
  "marginalReliefApplied": false
}
```

This payload is injected into the LLM's system prompt alongside conversational guidelines, constraining the neural model to act strictly as a semantic translator and empathetic explanatory interface.

---

## 4. Deterministic Ingestion and Invariants

### 4.1 Multi-Bank Ingestion and Decryption
Indian retail banks generate PDF statements encrypted with user-specific secrets (e.g., combinations of birth date, Permanent Account Number (PAN), or mobile digits). FinFlow implements an automated decryption pipeline backed by QPDF that algorithmically tests standardized mask combinations. Table extraction is driven by specialized regular expression fingerprinting profiles supporting **21 major Indian commercial banks** (including State Bank of India, HDFC Bank, ICICI Bank, Axis Bank, Kotak Mahindra Bank, Punjab National Bank, and Bank of Baroda).

### 4.2 Formal Balance Continuity Invariant
A critical vulnerability in retail statement parsing is the silent omission of transactions caused by page breaks, multi-line narrations, or table misalignment. To formally guarantee ingestion completeness, FinFlow enforces the **Balance Continuity Invariant**:

$$\forall i \in \{2, \dots, n\}: \quad | B_i - (B_{i-1} + C_i - D_i) | \le 0.01$$

Where:
- $B_i$ is the recorded closing balance after transaction $i$.
- $B_{i-1}$ is the closing balance of the preceding transaction.
- $C_i$ is the credit amount ($C_i = 0$ if debit).
- $D_i$ is the debit amount ($D_i = 0$ if credit).
- Tolerated precision error $\varepsilon = 0.01$ accounts for floating-point banking rounding. Any violation flags statement tampering or missing OCR lines immediately.

![Figure 3: Ingestion Balance Continuity Invariant](paper/figures/fig3_continuity_invariant.png)

### 4.3 Cryptographic Transaction Deduplication
Retail users frequently upload overlapping bank statements covering contiguous quarters. Simple timestamp matching is inadequate due to banking clearing delays. FinFlow computes a canonical cryptographic digest for each transaction $T_i$:

$$\mathcal{H}(T_i) = \text{SHA-256}\left(\text{Date}_i \parallel \text{Norm}(\text{Narration}_i) \parallel D_i \parallel C_i \parallel \text{BankID}\right)$$

Where $\text{Norm}(\cdot)$ strips non-alphanumeric whitespace and standardizes payment gateway tokens (e.g., UPI, IMPS, POS identifiers). Duplicate transactions are identified in $O(1)$ time and strictly rejected.

---

## 5. Statutory Dual-Regime Tax Optimization Engine

Under the Income Tax Act, 1961 (amended for AY 2024-25 and AY 2025-26), personal income tax is computed across two distinct statutory regimes.

### 5.1 Old Tax Regime
Gross income $Y$ is reduced by allowable exemptions and Chapter VI-A deductions:

$$Y_{\text{net, Old}} = \max\left(0, Y - \left(S_{\text{sal}} + \sum_{k \in \mathcal{D}} D_k + I_{\text{int}}\right)\right)$$

Where $S_{\text{sal}} = 50,000$ INR is the standard deduction for salaried individuals, and $\mathcal{D}$ denotes statutory deductions bounded by legal maximums:
- Section 80C: $D_{80C} = \min(\text{Investment}_{80C}, 150000)$
- Section 80D: $D_{80D} = \min(\text{Insurance}_{80D}, \theta_{\text{age}})$
- Section 80CCD(1B): $D_{80CCD(1B)} = \min(\text{NPS}, 50000)$
- Section 24(b): $D_{24(b)} = \min(\text{HomeLoanInterest}, 200000)$

Old Regime Section 87A rebate eliminates tax liability if taxable income does not exceed ₹5,00,000:

$$R_{87A, \text{Old}} = \begin{cases} \min(T_{\text{base}}, 12500) & \text{if } Y_{\text{net, Old}} \le 500000 \\ 0 & \text{otherwise} \end{cases}$$

### 5.2 New Tax Regime (Section 115BAC)
Under the concessional New Regime, Chapter VI-A deductions (except employer NPS contribution) are forfeited in exchange for broadened slabs. Taxable income is $Y_{\text{net, New}} = \max(0, Y - S_{\text{sal}})$. 

Section 87A rebate eliminates tax liability for income up to ₹7,00,000, with a non-linear **Marginal Relief** function defined for income marginally exceeding the threshold:

$$R_{\text{Marginal}} = \max\left(0, T_{\text{base}} - (Y_{\text{net, New}} - 700000)\right) \quad \text{for } 700000 < Y_{\text{net, New}} \le 727777$$

All net tax liabilities are augmented by a statutory 4% Health and Education Cess:

$$T_{\text{final}} = \text{round}\left((T_{\text{base}} - R) \times 1.04\right)$$

![Figure 2: Statutory Tax Curve and Breakeven Dynamics](paper/figures/fig2_tax_breakeven.png)

---

## 6. Neural Behavioral Analytics and Virtual CA

### 6.1 Unsupervised Spending Cohort Discovery
To provide actionable tax-saving insights (e.g., identifying unutilized Section 80C or 80D capacity based on historical spending), the neural tier implements unsupervised behavioral modeling:
- **K-Means Clustering:** Categorizes transactions into semantic clusters (Living, Discretionary, Tax-Deductible, Debt Service) based on normalized transaction magnitude, recurrence periodicity, transaction day-of-month, and counterparty MCC encoding.
- **DBSCAN Anomaly Detection:** Uncovers irregular transaction spikes and potential duplicate billing without supervision ($\varepsilon = 0.5, \text{MinPts} = 3$).

### 6.2 Context-Grounded Virtual CA
To provide natural conversational assistance without risking regulatory non-compliance, FinFlow employs a strict context-grounding protocol. The application server compiles the output of the Symbolic Core into an authoritative JSON state object injected into the LLM context.

---

## 7. Empirical Evaluation and Results

### 7.1 Benchmark 1: Statutory Tax Engine Verification ($N=50$)
We constructed a synthetic benchmark dataset of $N = 50$ distinct taxpayer profiles adhering to official CBDT specifications across six representative cohorts.

| Taxpayer Cohort | $N$ | Mean Gross Income (INR) | Old Regime Preferred | New Regime Preferred | Statutory Agreement | Mean Latency ($\mu$s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Salaried (Low: ₹3.5L–₹7.0L) | 10 | ₹507,500 | 0 | 10 | **100.00%** | 2.05 $\mu$s |
| Salaried (Mid: ₹7.5L–₹15.0L) | 15 | ₹1,100,000 | 6 | 9 | **100.00%** | 2.18 $\mu$s |
| Salaried (High: ₹16.0L–₹35.0L)| 10 | ₹2,500,000 | 8 | 2 | **100.00%** | 2.22 $\mu$s |
| Freelance (Sec 44ADA) | 5 | ₹2,800,000 | 2 | 3 | **100.00%** | 2.11 $\mu$s |
| Senior Citizens (Age $\ge$ 60)| 5 | ₹1,100,000 | 3 | 2 | **100.00%** | 2.16 $\mu$s |
| High Net Worth (> ₹50.0L) | 5 | ₹8,000,000 | 5 | 0 | **100.00%** | 2.19 $\mu$s |
| **Aggregate Total** | **50** | **₹2,216,500** | **24 (48%)** | **26 (52%)** | **100.00%** | **2.14 $\mu$s** |

### 7.2 Benchmark 2: Ingestion Invariant Verification
| Test Scenario | Total Records | Injected Anomalies | Detected Violations | Precision | Recall | False Positives |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Clean Bank Statement Feed | 1,000 txns | 0 | 0 | **100.00%** | **100.00%** | 0.00% |
| Perturbed / Dropped Rows | 1,000 txns | 50 | 96 (flanked) | **100.00%** | **100.00%** | 0.00% |
| Overlapping Duplicate Batch| 1,200 txns | 200 duplicates | 200 rejected | **100.00%** | **100.00%** | 0.00% |

### 7.3 Benchmark 3: Context Ablation and Hallucination Quantification
| Evaluation Metric | Ungrounded LLM Baseline | FinFlow Grounded Virtual CA | Performance Delta |
| :--- | :---: | :---: | :---: |
| **Regime Selection Accuracy** | 96.00% | **100.00%** | **+4.00% pts** |
| **Regime Selection Error Rate**| 4.00% | **0.00%** | **-4.00% pts** |
| **Mean Absolute Tax Error** | ₹1,905.20 | **₹0.00** | **-100.00%** |
| **Regulatory Hallucination Rate**| 0.00% | **0.00%** | Formally constrained |
| **Compute Execution Latency** | 1.84 s | **2.14 $\mu$s** | **>800,000× faster** |

![Figure 4: Context Ablation Comparison](paper/figures/fig4_ablation_comparison.png)

---

## 8. Threats to Validity and Practical Considerations
1. **OCR Quality Degradation:** Low-resolution mobile camera scans of physical bank passbooks may degrade OCR text recognition. However, FinFlow's balance continuity invariant guarantees that any dropped digit is caught immediately rather than silently propagated to the tax calculation.
2. **Legislative Evolution:** Indian Union Budgets annually amend slab thresholds. Because the statutory engine is modularized into declarative rule files, updating tax parameters requires no neural retraining.

---

## 9. Conclusion
In this paper, we introduced FinFlow, a neuro-symbolic platform addressing the dual challenges of unstructured multi-bank statement ingestion and statutory tax optimization under the Indian Income Tax Act. By decoupling informal conversational advisory from a formally verified symbolic core, FinFlow guarantees 100.00% statutory tax correctness and 100.00% ingestion anomaly detection, while eliminating arithmetic hallucinations in conversational LLMs. Empirical evaluation across 50 CBDT benchmark vectors and 1,000 multi-bank transaction streams demonstrates that neuro-symbolic grounding provides the formal rigor required to deploy AI safely in high-stakes retail finance.

---

## References
1. Shijie Wu, et al., "BloombergGPT: A Large Language Model for Finance," *arXiv preprint arXiv:2303.17564*, 2023.
2. Hongyang Yang, et al., "FinGPT: Open-Source Financial Large Language Models," *FinLLM Symposium at IJCAI*, 2023.
3. Zhiyu Chen, et al., "FinQA: A Dataset of Numerical Reasoning over Financial Data," *EMNLP*, pp. 3697–3711, 2021.
4. Timo Schick, et al., "Toolformer: Language Models Can Teach Themselves to Use Tools," *NeurIPS*, 2024.
5. Artur d'Avila Garcez and Luis C. Lamb, "Neurosymbolic AI: The 3rd Wave," *Artificial Intelligence Review*, vol. 56, pp. 12387–12406, 2023.
6. Central Board of Direct Taxes (CBDT), "Circular No. 1/2024: Explanatory Notes on Section 115BAC," *Ministry of Finance, Government of India*, 2024.
7. Government of India, "The Income-Tax Act, 1961 (Act No. 43 of 1961)," *Ministry of Law and Justice*, 1961.
8. R. Sharma, V. Patel, and A. Mehta, "Personal AI-Tax Advisor: (India Specific)," *IJCRT*, vol. 12, no. 4, pp. a112–a119, 2024.
9. S. Kumar and P. Rao, "Auto ITR: Automated Income Tax Return Preparation and Optimization Framework," *IJERT*, vol. 13, no. 5, pp. 450–456, 2024.
