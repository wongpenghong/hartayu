import type { Category } from "@/household/categories";
import { categoryNameById } from "@/household/category-utils";
import { isBillOverdue } from "@/household/bills";
import type { Bill } from "@/ledger/types";
import { formatYen, todayInTokyo } from "@/lib/format-yen";
import { EmptyState, GroupCard } from "@/components/NativeUI";

export function BillsDueSummary({
  bills,
  categories,
  loading,
  onPay,
  onAlreadyLogged,
  busyBillId,
}: {
  bills: Bill[];
  categories: Category[];
  loading?: boolean;
  onPay: (bill: Bill) => void;
  onAlreadyLogged: (bill: Bill) => void;
  busyBillId?: string | null;
}) {
  const namesById = categoryNameById(categories);
  const today = todayInTokyo();

  if (loading) {
    return (
      <GroupCard title="Bills due">
        <EmptyState message="Loading bills…" />
      </GroupCard>
    );
  }

  if (bills.length === 0) {
    return null;
  }

  return (
    <GroupCard title="Bills due">
      {bills.map((bill) => {
        const overdue = isBillOverdue(bill, today);
        const busy = busyBillId === bill.id;
        return (
          <div
            key={bill.id}
            className="border-b border-[#ececee] px-4 py-3.5 last:border-b-0 dark:border-neutral-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-medium">{bill.name}</p>
                <p
                  className={`mt-0.5 text-[13px] ${
                    overdue
                      ? "font-medium text-[#ff3b30]"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Due day {bill.dueDay}
                  {overdue ? " · Overdue" : ""}
                  {namesById.get(bill.categoryId)
                    ? ` · ${namesById.get(bill.categoryId)}`
                    : ""}
                </p>
                {bill.amountYen != null ? (
                  <p className="mt-1 text-[15px] font-semibold tabular-nums">
                    {formatYen(bill.amountYen)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onPay(bill)}
                className="rounded-full bg-[#007aff] px-4 py-2 text-[14px] font-medium text-white disabled:opacity-50"
              >
                Pay
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAlreadyLogged(bill)}
                className="rounded-full bg-[#f2f2f7] px-4 py-2 text-[14px] font-medium text-neutral-700 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200"
              >
                Already logged
              </button>
            </div>
          </div>
        );
      })}
    </GroupCard>
  );
}
