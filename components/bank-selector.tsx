"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Building2, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface BankAccount {
  id: string
  bankName: string
  accountNickname?: string | null
  accountLast4?: string | null
  accountType: string
}

export function BankSelector() {
  const [banks, setBanks] = useState<BankAccount[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentBankId = searchParams.get("bankId") || "all"

  useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data) => setBanks(data.banks || []))
      .catch(() => {})
  }, [])

  if (banks.length <= 1) return null

  const currentBank = banks.find((b) => b.id === currentBankId)
  const label = currentBank
    ? `${currentBank.bankName}${currentBank.accountNickname ? ` — ${currentBank.accountNickname}` : ""}`
    : "All Banks"

  const navigate = (bankId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (bankId === "all") {
      params.delete("bankId")
    } else {
      params.set("bankId", bankId)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span>{label}</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("all")} className={currentBankId === "all" ? "font-semibold" : ""}>
          All Banks
        </DropdownMenuItem>
        {banks.map((bank) => (
          <DropdownMenuItem
            key={bank.id}
            onClick={() => navigate(bank.id)}
            className={currentBankId === bank.id ? "font-semibold" : ""}
          >
            {bank.bankName}
            {bank.accountNickname ? ` — ${bank.accountNickname}` : ""}
            {bank.accountLast4 ? ` (••${bank.accountLast4})` : ""}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
