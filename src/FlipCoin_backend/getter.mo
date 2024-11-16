import Account "./Account";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import IcpLedger "canister:icp_ledger_canister";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Types "types";

module {
    public class Getter() {

        public func getDepositAccountId(canisterPrincipal : Principal, caller : Principal) : async Blob {
            let accountIdentifier = Account.accountIdentifier(canisterPrincipal, Account.principalToSubaccount(caller));
            return accountIdentifier;
        };

        // Return the account ID specific to this user's subaccount
        public func getDepositAccountIdArray(canisterPrincipal : Principal, caller : Principal) : async [Nat8] {
            let accountIdentifier = await getDepositAccountId(canisterPrincipal, caller);
            let accountIdentifierArray = Blob.toArray(accountIdentifier);
            return accountIdentifierArray;
        };

        public func getPendingDeposits(canisterPrincipal : Principal, caller : Principal) : async Types.Tokens {
            // Calculate target subaccount
            let source_account = Account.accountIdentifier(canisterPrincipal, Account.principalToSubaccount(caller));

            let source_account_nat_array = Blob.toArray(source_account); // Comment out for vite build
            // let source_account_nat_array = source_account; // Uncomment for vite build

            // Check ledger for value
            let balance = await IcpLedger.account_balance({
                account = source_account_nat_array;
            });

            return balance;
        };

        public func getICPBalance(canisterPrincipal : Principal) : async ?Nat64 {
            // Convert principal to account id
            let accountIdentifier = await IcpLedger.account_identifier({
                owner = canisterPrincipal;
                subaccount = null;
            });

            // Make inter canister call for balance
            let balanceResult = await IcpLedger.account_balance({
                account = accountIdentifier;
            });

            // Return the balance in e8s (1 ICP = 1e8 e8s).
            return ?balanceResult.e8s;
        };

        public func getFlipHistory(flipHistory : Buffer.Buffer<Types.Flip>, start : Nat, end : Nat) : async [Types.Flip] {
            let size = flipHistory.size();
            let validStart = Nat.max(0, start);
            let validEnd = Nat.min(size, end); // Ensure validEnd is within bounds
            var flips : [Types.Flip] = [];

            for (i in Iter.range(validStart, validEnd - 1)) {
                let flipOpt = flipHistory.get(i);
                flips := Array.append(flips, [flipOpt]);
            };
            return flips;
        };
    };
};
