// src/components/dashboard/AddressManager.tsx
"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Loader2,
  X,
  Check,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IAddressSerializable } from "@/types/user";

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: IAddressSerializable[];
}) {
  const [addresses, setAddresses] =
    useState<IAddressSerializable[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Form State for new/edit
  const [formData, setFormData] = useState({
    label: "Home",
    name: "",
    phone: "",
    addressLine1: "",
    city: "",
    district: "",
    postalCode: "",
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      label: "Home",
      name: "",
      phone: "",
      addressLine1: "",
      city: "",
      district: "",
      postalCode: "",
      isDefault: false,
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("adding");
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        setShowAddForm(false);
        resetForm();
        toast.success("ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে");
      } else {
        toast.error(data.error || "ঠিকানা সংরক্ষণ করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার এরর, একটু পর আবার চেষ্টা করুন");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই ঠিকানাটি মুছে ফেলতে চান?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        toast.success("ঠিকানা মুছে ফেলা হয়েছে");
      }
    } catch {
      toast.error("ঠিকানা মুছতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(null);
    }
  };

  const toggleDefault = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        toast.success("ডিফল্ট ঠিকানা আপডেট হয়েছে");
      }
    } catch {
      toast.error("ডিফল্ট ঠিকানা আপডেট করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      {!showAddForm && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#fdf6f0] dark:bg-slate-800 flex items-center justify-center text-[#240303] dark:text-[#E5B869] shrink-0">
              <MapPin className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                সংরক্ষিত ঠিকানাসমূহ
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                মোট {addresses.length} টি ঠিকানা সংরক্ষিত রয়েছে
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg px-4 h-10 bg-[#240303] hover:bg-[#3a0808] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <Plus className="size-4 mr-1.5" /> নতুন ঠিকানা যোগ করুন
          </Button>
        </div>
      )}

      {/* Add New Address Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              নতুন ঠিকানা যুক্ত করুন
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ঠিকানার লেবেল (বাছাই করুন)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Home", "Office"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, label: l }))}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        formData.label === l
                          ? "bg-[#240303] text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      {l === "Home" ? (
                        <Home className="size-3.5 inline mr-1" />
                      ) : (
                        <Briefcase className="size-3.5 inline mr-1" />
                      )}
                      {l === "Home" ? "বাসা (Home)" : "অফিস (Office)"}
                    </button>
                  ))}
                  <Input
                    placeholder="অন্যান্য (যেমন: শপ)"
                    className="h-9 rounded-lg max-w-[160px] text-xs"
                    value={
                      formData.label !== "Home" && formData.label !== "Office"
                        ? formData.label
                        : ""
                    }
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  প্রাপকের পূর্ণ নাম *
                </label>
                <Input
                  required
                  placeholder="নাম লিখুন"
                  className="h-10 rounded-lg text-xs sm:text-sm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর *
                </label>
                <Input
                  required
                  placeholder="017XXXXXXXX"
                  className="h-10 rounded-lg text-xs sm:text-sm"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  বিস্তারিত ঠিকানা (বাসা/ফ্ল্যাট নং, রোড, এলাকা) *
                </label>
                <Input
                  required
                  placeholder="ঠিকানা বিস্তারিত লিখুন..."
                  className="h-10 rounded-lg text-xs sm:text-sm"
                  value={formData.addressLine1}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, addressLine1: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  শহর / থানা *
                </label>
                <Input
                  required
                  placeholder="যেমন: মিরপুর, ঢাকা"
                  className="h-10 rounded-lg text-xs sm:text-sm"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  জেলা *
                </label>
                <Input
                  required
                  placeholder="যেমন: ঢাকা"
                  className="h-10 rounded-lg text-xs sm:text-sm"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, district: e.target.value }))
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 w-fit">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, isDefault: e.target.checked }))
                }
                className="size-4 rounded border-slate-300 text-[#240303] focus:ring-[#240303]"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                ডিফল্ট ডেলিভারি ঠিকানা হিসেবে সেট করুন
              </span>
            </label>

            <div className="pt-3 flex items-center gap-3">
              <Button
                type="submit"
                disabled={loading === "adding"}
                className="h-10 px-6 rounded-lg bg-[#240303] hover:bg-[#3a0808] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              >
                {loading === "adding" ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Plus className="size-4 mr-1" />
                )}
                ঠিকানা সংরক্ষণ করুন
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-5 rounded-lg text-xs sm:text-sm font-bold border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                বাতিল
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr._id}
            className={cn(
              "bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between gap-4 shadow-xs",
              addr.isDefault
                ? "border-[#240303] dark:border-[#E5B869] bg-[#fdf6f0]/40 dark:bg-slate-800/40"
                : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            )}
          >
            {addr.isDefault && (
              <div className="absolute top-0 right-0 bg-[#240303] text-white px-3 py-1 text-[10px] font-bold rounded-bl-xl shadow-2xs flex items-center gap-1">
                <Check className="size-3 stroke-[3px]" />
                <span>ডিফল্ট</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  {addr.label === "Office" ? (
                    <Briefcase className="size-4" />
                  ) : (
                    <Home className="size-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {addr.label === "Home"
                      ? "বাসা (Home)"
                      : addr.label === "Office"
                      ? "অফিস (Office)"
                      : addr.label}
                  </h4>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <User className="size-3 text-slate-400 shrink-0" />
                  <span>{addr.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="size-3 text-slate-400 shrink-0" />
                  <span>{addr.phone}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 pl-5 leading-relaxed">
                  {addr.addressLine1}
                  {addr.city ? `, ${addr.city}` : ""}
                  {addr.district ? `, ${addr.district}` : ""}
                  {addr.postalCode ? ` - ${addr.postalCode}` : ""}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              {!addr.isDefault ? (
                <button
                  type="button"
                  disabled={loading === addr._id}
                  onClick={() => toggleDefault(addr._id)}
                  className="text-slate-600 hover:text-[#240303] dark:text-slate-400 dark:hover:text-[#E5B869] font-semibold text-[11px] underline underline-offset-2 cursor-pointer"
                >
                  ডিফল্ট করুন
                </button>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <Check className="size-3" /> প্রাথমিক ঠিকানা
                </span>
              )}

              <button
                type="button"
                disabled={loading === addr._id}
                onClick={() => handleDelete(addr._id)}
                className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold text-[11px] cursor-pointer ml-auto"
              >
                {loading === addr._id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
                <span>মুছুন</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && !showAddForm && (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <MapPin className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
            কোনো ঠিকানা সংরক্ষণ করা নেই
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
            আপনার ডেলিভারি ঠিকানা যুক্ত করে রাখুন যাতে প্রতিবার চেকআউটে নতুন করে পূরণ করতে না হয়।
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg px-4 h-9 bg-[#240303] hover:bg-[#3a0808] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5 mr-1" /> নতুন ঠিকানা যোগ করুন
          </Button>
        </div>
      )}
    </div>
  );
}
