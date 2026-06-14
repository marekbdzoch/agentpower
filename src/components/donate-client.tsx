"use client";

import { CircleDollarSign } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@/lib/project-generator";
import type { PaymentGatewayConnection, PowerPricing } from "@/lib/types";

export function DonateClient({
  projectId,
  gateway,
  powerPricing,
}: {
  projectId: string;
  gateway?: PaymentGatewayConnection;
  powerPricing: PowerPricing;
}) {
  const [message, setMessage] = useState(`${gateway?.displayName ?? "Mock Gateway"} checkout is ready.`);

  async function donate(formData: FormData) {
    const powerDays = Number(formData.get("powerDays") ?? 1);
    const contributorName = String(formData.get("contributorName") ?? "Anonymous supporter");
    const amountCents = Math.max(1, powerDays) * powerPricing.pricePerDayCents;
    const response = await fetch(`/api/projects/${projectId}/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents,
        contributorName,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as { donation: { paymentProvider: string; externalReference: string } };
      setMessage(`Donation recorded through ${result.donation.paymentProvider}: ${result.donation.externalReference}.`);
    } else {
      setMessage("Donation failed.");
    }
  }

  return (
    <form action={donate} className="grid max-w-md gap-4 rounded-lg border border-[#d8d7c9] bg-white p-5">
      <div className="flex items-center gap-2">
        <CircleDollarSign className="size-5 text-[#b84d31]" />
        <h2 className="text-xl font-semibold">Support runtime</h2>
      </div>
      <div className="rounded-md bg-[#f7f7f2] px-3 py-2 text-sm">
        <span className="font-semibold">{gateway?.displayName ?? "Mock Gateway"}</span>
        <span className="ml-2 font-mono text-xs text-[#526158]">
          {gateway?.provider ?? "mock"} · {gateway?.mode ?? "test"}
        </span>
      </div>
      <div className="rounded-md bg-[#e7f3ed] px-3 py-2 text-sm">
        <span className="font-semibold">{formatMoney(powerPricing.pricePerDayCents)} / power day</span>
        <span className="ml-2 text-[#526158]">{powerPricing.includedAgentRuns} included agent runs</span>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Contributor
        <input
          name="contributorName"
          defaultValue="Community backer"
          className="h-10 rounded-md border border-[#c9c8ba] px-3"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Power days
        <input name="powerDays" type="number" defaultValue="1" min="1" className="h-10 rounded-md border border-[#c9c8ba] px-3" />
      </label>
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#b84d31] px-4 text-sm font-semibold text-white">
        <CircleDollarSign className="size-4" />
        Donate
      </button>
      <p className="text-sm text-[#526158]">{message}</p>
    </form>
  );
}
