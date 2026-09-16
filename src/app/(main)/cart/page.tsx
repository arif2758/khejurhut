import { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "আপনার কার্ট | খেজুর হাট",
  description: "আপনার পছন্দের খাঁটি ও প্রিমিয়াম খেজুরগুলো অর্ডার করার জন্য কার্ট চেক করুন।",
};

export default function CartPage() {
  return <CartPageClient />;
}
