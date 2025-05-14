export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PaymentContent from "./PaymentContent";
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading payment page...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
