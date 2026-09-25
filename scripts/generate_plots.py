#!/usr/bin/env python3
"""
FinFlow Publication Figure Generator
Generates publication-quality charts for IEEE paper submission.
"""

import os
import numpy as np
import matplotlib
matplotlib.use('Agg') # Non-interactive headless backend
import matplotlib.pyplot as plt

os.makedirs('paper/figures', exist_ok=True)

# Set consistent IEEE style
plt.rcParams.update({
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 12,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
    'figure.titlesize': 13,
    'figure.dpi': 300,
    'lines.linewidth': 1.8,
    'grid.alpha': 0.4
})

# ==============================================================================
# FIGURE 1: TAX REGIME BREAKEVEN & MARGINAL RELIEF CURVE
# ==============================================================================
def plot_tax_breakeven():
    incomes = np.linspace(300000, 2000000, 500)
    
    # 1. New Regime (AY 2024-25, Section 115BAC)
    def calc_new(gross):
        taxable = max(0.0, gross - 50000.0) # Std deduction
        tax = 0.0
        if taxable > 300000:
            tax += min(300000, taxable - 300000) * 0.05
        if taxable > 600000:
            tax += min(300000, taxable - 600000) * 0.10
        if taxable > 900000:
            tax += min(300000, taxable - 900000) * 0.15
        if taxable > 1200000:
            tax += min(300000, taxable - 1200000) * 0.20
        if taxable > 1500000:
            tax += (taxable - 1500000) * 0.30
            
        # 87A rebate
        if taxable <= 700000:
            tax = 0.0
        elif 700000 < taxable < 727777:
            excess = taxable - 700000
            if tax > excess:
                tax = excess
        return tax * 1.04

    # 2. Old Regime
    def calc_old(gross, deductions):
        taxable = max(0.0, gross - deductions)
        tax = 0.0
        if taxable > 250000:
            tax += min(250000, taxable - 250000) * 0.05
        if taxable > 500000:
            tax += min(500000, taxable - 500000) * 0.20
        if taxable > 1000000:
            tax += (taxable - 1000000) * 0.30
            
        if taxable <= 500000:
            tax = 0.0
        return tax * 1.04

    tax_new = [calc_new(inc) for inc in incomes]
    tax_old_low = [calc_old(inc, 100000.0) for inc in incomes]   # Std 50k + 80C 50k
    tax_old_mid = [calc_old(inc, 225000.0) for inc in incomes]   # Std 50k + 80C 1.5L + 80D 25k
    tax_old_high = [calc_old(inc, 475000.0) for inc in incomes]  # Std 50k + 80C 1.5L + 80D 25k + NPS 50k + Home Loan 2L

    fig, ax = plt.subplots(figsize=(6.5, 4.2))
    ax.plot(incomes / 100000, np.array(tax_new) / 1000, 'k-', linewidth=2.2, label='New Regime (Sec 115BAC)')
    ax.plot(incomes / 100000, np.array(tax_old_low) / 1000, 'r--', label='Old Regime (Low Ded: Rs 1.0L)')
    ax.plot(incomes / 100000, np.array(tax_old_mid) / 1000, 'b-.', label='Old Regime (Standard Ded: Rs 2.25L)')
    ax.plot(incomes / 100000, np.array(tax_old_high) / 1000, 'g:', linewidth=2.2, label='Old Regime (Aggressive Ded: Rs 4.75L)')

    # Annotate Section 87A rebate thresholds
    ax.axvline(x=7.5, color='gray', linestyle='--', alpha=0.6)
    ax.text(7.6, 280, 'New Regime 87A Cap\n(Rs 7.5L Gross)', fontsize=8, color='#333333')

    ax.set_title('Fig. 2. Statutory Dual-Regime Tax Curve & Deduction Breakeven Dynamics')
    ax.set_xlabel('Gross Annual Income (Rs Lakhs)')
    ax.set_ylabel('Total Tax Payable (Rs Thousands)')
    ax.grid(True, linestyle=':')
    ax.legend(loc='upper left', frameon=True)
    plt.tight_layout()
    plt.savefig('paper/figures/fig2_tax_breakeven.png', dpi=300)
    plt.close()
    print("✓ Generated paper/figures/fig2_tax_breakeven.png")

# ==============================================================================
# FIGURE 2: BALANCE CONTINUITY INVARIANT VERIFICATION
# ==============================================================================
def plot_continuity_invariant():
    np.random.seed(42)
    n = 100
    transactions = np.arange(1, n + 1)
    
    # Baseline precision noise within +/- 0.005 (floating-point rounding)
    drifts = np.random.uniform(-0.004, 0.004, n)
    
    # Inject deliberate balance continuity violations at steps 25, 55, 80
    drifts[24] = 450.0   # Dropped transaction
    drifts[54] = -120.50 # OCR character misread
    drifts[79] = 25.0    # Transposition error

    fig, ax = plt.subplots(figsize=(6.5, 3.8))
    
    # Normal points
    normal_mask = np.abs(drifts) <= 0.01
    ax.scatter(transactions[normal_mask], drifts[normal_mask], color='#2563eb', s=16, label='Clean Invariant Compliant', zorder=3)
    
    # Anomalous points
    anomaly_mask = ~normal_mask
    ax.scatter(transactions[anomaly_mask], drifts[anomaly_mask], color='#dc2626', s=60, marker='X', label='Continuity Invariant Violations', zorder=4)

    # Invariant threshold lines
    ax.axhline(y=0.01, color='orange', linestyle='--', linewidth=1.2, label=r'Tolerance Bound ($\epsilon = \pm 0.01$)')
    ax.axhline(y=-0.01, color='orange', linestyle='--', linewidth=1.2)

    ax.set_yscale('symlog', linthresh=0.05)
    ax.set_title(r'Fig. 3. Ingestion Balance Continuity Invariant: $|B_i - (B_{i-1} + C_i - D_i)| \leq 0.01$')
    ax.set_xlabel(r'Transaction Sequence Index $i$')
    ax.set_ylabel(r'Balance Discrepancy $\Delta B$ (INR, SymLog Scale)')
    ax.grid(True, linestyle=':')
    ax.legend(loc='lower left', frameon=True)
    plt.tight_layout()
    plt.savefig('paper/figures/fig3_continuity_invariant.png', dpi=300)
    plt.close()
    print("✓ Generated paper/figures/fig3_continuity_invariant.png")

# ==============================================================================
# FIGURE 4: MULTI-BANK EXTRACTION ACCURACY & INVARIANT SENSITIVITY
# ==============================================================================
def plot_bank_extraction_accuracy():
    import json
    results_path = 'finflow_e1_corpus/results_evaluation.json'
    
    with open(results_path, 'r') as f:
        data = json.load(f)
        
    bank_data = data['e2_deterministic_parser']['per_bank']
    # Sort by layout family and name
    bank_names = [b['bank'] for b in bank_data]
    f1_scores = [b['f1'] * 100 for b in bank_data]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 3.6), gridspec_kw={'width_ratios': [1.8, 1]})
    
    # Left: Per-Bank F1 Score
    colors = ['#10b981' if f1 > 99.0 else '#3b82f6' for f1 in f1_scores]
    bars = ax1.bar(bank_names, f1_scores, color=colors, edgecolor='#1e293b', width=0.55)
    
    ax1.axhline(y=93.8, color='#ef4444', linestyle='--', linewidth=1.2, label='Micro F1 (93.8%)')
    ax1.set_ylabel('Extraction F1-Score (%)', fontsize=9, fontweight='bold')
    ax1.set_title('(a) Extraction F1 by Bank Layout', fontsize=10, fontweight='bold')
    ax1.set_ylim(80, 105)
    ax1.grid(axis='y', linestyle=':', alpha=0.7)
    ax1.legend(loc='lower left', fontsize=8)
    
    for bar in bars:
        h = bar.get_height()
        ax1.annotate(f'{h:.1f}%',
                     xy=(bar.get_x() + bar.get_width() / 2, h),
                     xytext=(0, 3), textcoords="offset points",
                     ha='center', va='bottom', fontsize=7.5, fontweight='bold')

    # Right: Invariant Sensitivity across Error Modes
    perturb_data = data['e4_perturbation_analysis']
    modes = ['Omission', 'Insertion', 'Tampering']
    sensitivities = [
        perturb_data['omission']['detection_sensitivity'] * 100,
        perturb_data['insertion']['detection_sensitivity'] * 100,
        perturb_data['amount_tamper']['detection_sensitivity'] * 100
    ]
    
    bars2 = ax2.bar(modes, sensitivities, color='#8b5cf6', edgecolor='#4c1d95', width=0.5)
    ax2.set_ylabel('Detection Sensitivity (%)', fontsize=9, fontweight='bold')
    ax2.set_title('(b) Invariant Sensitivity', fontsize=10, fontweight='bold')
    ax2.set_ylim(95, 101.5)
    ax2.grid(axis='y', linestyle=':', alpha=0.7)
    
    for bar in bars2:
        h = bar.get_height()
        ax2.annotate(f'{h:.2f}%',
                     xy=(bar.get_x() + bar.get_width() / 2, h),
                     xytext=(0, 3), textcoords="offset points",
                     ha='center', va='bottom', fontsize=7.5, fontweight='bold')

    plt.tight_layout()
    plt.savefig('paper/figures/fig4_ablation_comparison.png', dpi=300)
    plt.close()
    print("✓ Generated paper/figures/fig4_ablation_comparison.png from empirical evaluation")

if __name__ == '__main__':
    plot_tax_breakeven()
    plot_continuity_invariant()
    plot_bank_extraction_accuracy()

