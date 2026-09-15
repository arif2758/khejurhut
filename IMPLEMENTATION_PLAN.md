# মাল্টি-কুরিয়ার ও মাল্টি-চ্যানেল লজিস্টিকস ইঞ্জিন ইমপ্লিমেন্টেশন প্ল্যান

এই প্ল্যানে **GadgeterHub** ই-কমার্স প্ল্যাটফর্মে একটি নমনীয় (Pluggable) **মাল্টি-কুরিয়ার লজিস্টিকস সিস্টেম** যুক্ত করার সম্পূর্ণ রূপরেখা দেওয়া হলো। এটি আপনার বর্তমান **অফলাইন/ম্যানুয়াল বুকিং** প্রক্রিয়াকে ১০০% অক্ষুণ্ণ রেখে **Pathao Merchant API** এবং **Steadfast Courier API** এর সাথে ১-ক্লিকে সুইচিং করার সুবিধা প্রদান করবে।

---

## 🎯 ইউআই ও রাউটিং সিদ্ধান্ত (Unified Single Route Architecture)

**একক রাউট (`/admin/orders`) ব্যবহার করা হবে:**
১. **সহজ নেভিগেশন (Single Source of Truth):** একটি অর্ডার (`Order #1001`) পাঠাও, স্টিডফাস্ট বা অফলাইন যেভাবেই পাঠানো হোক না কেন, সব অর্ডার একক পেজে **`/admin/orders`** মিলবে।
২. **১-ক্লিক কুরিয়ার সুইচ (Per-Order Carrier Switcher):** প্রতিটি অর্ডারের পাশে কুরিয়ার ব্যাজ (`🏢 Offline`, `🔴 Pathao`, `🦅 Steadfast`) থাকবে এবং **`🚀 Ship Order`** বাটনে ক্লিক করে একই পেজে কুরিয়ার পরিবর্তন বা অটো বুকিং দেওয়া যাবে।
৩. **স্মার্ট ফিল্টারিং:** উপরে ফিল্টার ট্যাবে `[ All Carriers ]`, `[ 🏢 Offline ]`, `[ 🔴 Pathao ]`, `[ 🦅 Steadfast ]` থাকবে যাতে ১-ক্লিকে যেকোনো নির্দিষ্ট কুরিয়ারের অর্ডার ফিল্টার করে দেখা যায়।

---

## 📌 প্রয়োজনীয় ক্রেডেনশিয়াল প্রস্তুতি

**Pathao API Credentials:**
- `PATHAO_BASE_URL` (টেস্টিং: `https://courier-api-sandbox.pathao.com` | লাইভ: `https://api-hermes.pathao.com`)
- `PATHAO_CLIENT_ID`
- `PATHAO_CLIENT_SECRET`
- `PATHAO_USERNAME` (পাঠাও মার্চেন্ট ইমেইল)
- `PATHAO_PASSWORD` (পাঠাও মার্চেন্ট পাসওয়ার্ড)
- `PATHAO_STORE_ID`

**Steadfast API Credentials:**
- `STEADFAST_BASE_URL` (`https://portal.packzy.com/api/v1`)
- `STEADFAST_API_KEY`
- `STEADFAST_SECRET_KEY`

**বর্তমান অফলাইন ওয়ার্কফ্লো ১০০% অপরিবর্তিত থাকবে:**
অর্ডারের ডিফল্ট মোড থাকবে `offline` (অফলাইন)। আপনি কুরিয়ার কাউন্টারে গিয়ে ম্যানুয়ালি পার্সেল বুকিং দিয়ে আগের মতোই ট্র্যাকিং আইডি বসাতে পারবেন। যখনই অনলাইন API ব্যবহার করতে চাইবেন, শুধু সুইচ সিলেক্ট করে দিলে অটো বুকিং হয়ে যাবে!

---

## 🛠️ বাস্তবায়নের ধাপসমূহ (Implementation Steps)

### ১. কোর টাইপ ও মডেল (Core Types & Models)
- `d:\my-project\gadgeterhub\src\types\order.ts`:
  - `CourierProviderName` ইউনিয়ন টাইপ যোগ করা: `"offline" | "pathao" | "steadfast" | "paperfly" | "redx"`.
  - `IOrderBase` এ `courierProvider?: CourierProviderName;`, `courierConsignmentId?: string;` যুক্ত করা।
- `d:\my-project\gadgeterhub\src\models\Order.ts`:
  - `courierProvider` ফিল্ড যুক্ত করা (ডিফল্ট `"offline"`)।

---

### ২. কুরিয়ার API ক্লায়েন্ট (Logistics API Clients)
- `d:\my-project\gadgeterhub\src\lib\steadfastApi.ts`:
  - স্টিডফাস্ট V1 API (`/create_order`, `/create_order/bulk-order`, `/status_by_cid/{id}`, `/get_balance`)
- `d:\my-project\gadgeterhub\src\lib\pathaoMerchantApi.ts`:
  - পাঠাও মার্চেন্ট API (`/issue-token`, `/orders`, `/price-plan`)
- `d:\my-project\gadgeterhub\src\lib\courierManager.ts`:
  - সেন্ট্রাল কুরিয়ার ম্যানেজার হ্যান্ডলার (`bookOrderWithCarrier`)

---

### ৩. সার্ভার অ্যাকশনসমূহ (Server Actions)
- `d:\my-project\gadgeterhub\src\actions\courierActions.ts`:
  - `bookSingleOrderAction(orderId, carrier, options)`
  - `syncOrderCarrierStatusAction(orderId)`
  - `getCarrierBalancesAction()`

---

### ৪. অ্যাডমিন ইউআই উপাদানসমূহ (Admin UI Components)
- `d:\my-project\gadgeterhub\src\components\admin\CarrierSelectorModal.tsx`: কুরিয়ার সিলেক্টর মোডাল।
- `d:\my-project\gadgeterhub\src\components\admin\AdminOrdersAntdClient.tsx`: অর্ডারের পাশে কুরিয়ার ব্যাজ ও `🚀 Ship Order` বাটন।
- `d:\my-project\gadgeterhub\src\app\(admin)\admin\courier\CourierMonitorClient.tsx`: মাল্টি-কুরিয়ার লাইভ ট্র্যাকিং।
