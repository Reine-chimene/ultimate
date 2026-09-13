"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PremiumGate({ message }: { message: string }) {
  return (
    <div className="premium-card border-[#c9a962]/20 p-6 text-center">
      <Crown className="mx-auto h-8 w-8 text-[#c9a962]" />
      <p className="mt-3 text-sm text-[#9a8f8a]">{message}</p>
      <Link href="/premium" className="mt-4 inline-block">
        <Button variant="gold" size="sm">
          Découvrir Premium
        </Button>
      </Link>
    </div>
  );
}
