"use client";

import { useState } from "react";
import {
  Phone,
  MapPin,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { WhatsAppIcon } from "@/socialCustomSVGIcon/SocialCustomSVGIcon";
import { toast } from "sonner";
import { submitContactForm } from "@/actions/contact";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    setIsLoading(false);
    if (result.success) {
      toast.success("Message sent successfully!", {
        description: "We will get back to you as soon as possible.",
        icon: <MessageSquare className="size-4" />,
      });
      (e.target as HTMLFormElement).reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-transparent pt-8 pb-16">
      {/* Container */}
      <div className="container max-w-6xl px-4 mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-[#1A0101]/10 rounded-2xl mb-2">
            <MessageSquare className="size-8 text-[#1A0101] dark:text-[#E5B869]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#120000] dark:text-foreground tracking-tight">
            যোগাযোগ করুন
          </h1>
          <p className="text-[#5C4D4A] dark:text-muted-foreground font-medium md:text-lg leading-relaxed">
            আপনার যেকোনো প্রশ্ন, বিশেষ অর্ডারের তথ্য কিংবা সহায়তার জন্য আমরা সর্বদা প্রস্তুত।
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
          {/* Left: Contact Info Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/80 dark:bg-[#1A0505]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#2F0C0B]/12 shadow-[0_4px_20px_rgba(42,1,1,0.06)] relative overflow-hidden group hover:border-[#2F0C0B]/25 transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-[#1A0101]">
                <Phone className="size-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#120000] dark:text-foreground mb-1">
                    সরাসরি কল করুন
                  </h3>
                  <p className="text-[#5C4D4A] dark:text-muted-foreground text-sm">
                    শনিবার - বৃহস্পতিবার, সকাল ৯টা - রাত ৮টা
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-[#1A0101]/10 text-[#1A0101] dark:text-[#E5B869] rounded-xl flex items-center justify-center">
                    <Phone className="size-5" />
                  </div>
                  <span className="text-lg font-bold text-[#120000] dark:text-foreground tracking-wide">
                    +880 1568390014
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#1A0505]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#2F0C0B]/12 shadow-[0_4px_20px_rgba(42,1,1,0.06)] relative overflow-hidden group hover:border-[#2F0C0B]/25 transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-[#C59B27]">
                <MapPin className="size-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#120000] dark:text-foreground mb-1">
                    অফিস ও হাব
                  </h3>
                  <p className="text-[#5C4D4A] dark:text-muted-foreground text-sm">সরাসরি ডেলিভারি কার্যক্রম</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-[#C59B27]/15 text-[#C59B27] rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <span className="text-base font-bold text-[#120000] dark:text-foreground">
                    সাউথ কেরানীগঞ্জ, ঢাকা,
                    <br />
                    বাংলাদেশ।
                  </span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/8801568390014" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/80 dark:bg-[#1A0505]/60 backdrop-blur-xl rounded-3xl p-8 border border-[#2F0C0B]/12 shadow-[0_4px_20px_rgba(42,1,1,0.06)] relative overflow-hidden group block hover:border-[#25D366]/40 hover:shadow-[#25D366]/10 transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:text-[#25D366] transition-colors">
                <WhatsAppIcon className="size-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#120000] dark:text-foreground mb-1 group-hover:text-[#25D366] transition-colors">
                    হোয়াটসঅ্যাপে চ্যাট করুন
                  </h3>
                  <p className="text-[#5C4D4A] dark:text-muted-foreground text-sm">তাৎক্ষণিক সহায়তা ও অর্ডার</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <WhatsAppIcon className="size-5" />
                  </div>
                  <span className="text-base font-bold text-[#120000] dark:text-foreground">
                    +880 1568390014
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* Right: Modern Contact Form */}
          <div className="lg:col-span-7 bg-white/90 dark:bg-[#1A0505]/70 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-[#2F0C0B]/12 shadow-[0_8px_32px_rgba(42,1,1,0.08)]">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#120000] dark:text-foreground">
                আমাদের বার্তা পাঠান
              </h2>
              <p className="text-[#5C4D4A] dark:text-muted-foreground text-sm mt-1">
                আপনার বার্তা পাওয়ার পর আমরা দ্রুত যোগাযোগ করবো।
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-bold text-[#120000] dark:text-foreground pl-1"
                  >
                    আপনার নাম *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="আপনার পূর্ণ নাম"
                    disabled={isLoading}
                    className="w-full bg-[#FAF7F2]/70 dark:bg-black/20 border border-[#2F0C0B]/15 rounded-2xl px-4 py-3.5 text-sm text-[#120000] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 focus:border-[#C59B27] transition-all focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-bold text-[#120000] dark:text-foreground pl-1"
                  >
                    মোবাইল নম্বর *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    disabled={isLoading}
                    className="w-full bg-[#FAF7F2]/70 dark:bg-black/20 border border-[#2F0C0B]/15 rounded-2xl px-4 py-3.5 text-sm text-[#120000] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 focus:border-[#C59B27] transition-all focus:bg-white"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-bold text-[#120000] dark:text-foreground pl-1"
                >
                  বিষয় *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  placeholder="কী বিষয়ে জানতে চান?"
                  disabled={isLoading}
                  className="w-full bg-[#FAF7F2]/70 dark:bg-black/20 border border-[#2F0C0B]/15 rounded-2xl px-4 py-3.5 text-sm text-[#120000] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 focus:border-[#C59B27] transition-all focus:bg-white"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-bold text-[#120000] dark:text-foreground pl-1"
                >
                  আপনার বার্তা *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="বিস্তারিত লিখুন..."
                  disabled={isLoading}
                  className="w-full bg-[#FAF7F2]/70 dark:bg-black/20 border border-[#2F0C0B]/15 rounded-2xl px-4 py-3.5 text-sm text-[#120000] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 focus:border-[#C59B27] transition-all focus:bg-white resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-[#1A0101] via-[#240303] to-[#1E0202] text-[#FAF6F0] hover:from-[#240303] hover:to-[#2D0505] shadow-xl shadow-[#1A0101]/25 hover:shadow-[#1A0101]/35 active:scale-[0.98] transition-all border border-[#C59B27]/30"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin mx-auto text-[#D4A373]" />
                  ) : (
                    <>
                      <Send className="size-5 mr-2 text-[#D4A373]" />
                      বার্তা পাঠান
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
