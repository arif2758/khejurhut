// src/app/(main)/track-order/page.tsx
import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/order/TrackOrderForm";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাকিং | খেজুর",
  description: "আপনার অর্ডারের বর্তমান অগ্রগতি ও ডেলিভারি স্ট্যাটাস ট্র্যাক করুন।",
};

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen py-10 sm:py-14 px-4 sm:px-6">
      <TrackOrderForm />
    </main>
  );
}

