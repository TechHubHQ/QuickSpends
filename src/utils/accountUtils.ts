import { Account } from "../hooks/useAccounts";

export const processAccounts = (accounts: Account[]): Account[] => {
  // 1. Create a map for O(1) lookup
  const accountMap = new Map<string, Account>();
  accounts.forEach((acc) => accountMap.set(acc.id, acc));

  // 2. Update balances
  const processedAccounts = accounts.map((acc) => {
    if (acc.linked_account_id) {
      const parent = accountMap.get(acc.linked_account_id);
      if (parent) {
        // For shared limit, it's exactly the parent's balance
        if (acc.is_shared_limit) {
          return {
            ...acc,
            balance: parent.balance,
            credit_limit: parent.credit_limit,
          };
        }
        // For custom limit, it's min(ChildAvailable, ParentAvailable)
        const effectiveBalance = Math.min(acc.balance, parent.balance);
        return { ...acc, balance: effectiveBalance };
      }
    }
    return acc;
  });

  return processedAccounts;
};
