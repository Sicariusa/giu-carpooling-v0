export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PaymentContent from "./PaymentContent";
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-giu-red rounded-full"></div>
          <div className="text-xl font-medium text-gray-700">Preparing your payment...</div>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}