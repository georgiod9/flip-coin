#!/usr/bin/env bash
# This script rebalances the FlipCoin canister's book to match actual ICP balance
# It does the following:
# 1. Shows the canister principal and account ID
# 2. Shows the canister's ICP balance and credit balance before rebalance
# 3. Calls the rebalanceBook function to sync the book with actual balance
# 4. Shows updated balances after rebalance

# Usage:
# ./rebalance_book.sh

# Requirements:
# - dfx must be installed and running
# - User must be the canister owner/admin
# - FlipCoin_backend canister must be deployed
# - icp_ledger_canister must be deployed

echo "===========REBALANCING==========="

# Get canister principal, ID and ID in bytes
echo ""
echo "===========CANISTER==========="
CANISTER_PRINCIPAL=$(dfx canister id FlipCoin_backend)
CANISTER_ID=$(dfx ledger account-id --of-canister $CANISTER_PRINCIPAL)
CANISTER_ID_IN_BYTES="$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$CANISTER_ID'")]) + "}")')"

echo ">Principal: $CANISTER_PRINCIPAL"
echo ">ID: $CANISTER_ID"

# Get canister balance before admin deposit (ICP balance and book credit)
echo ""
echo "===========CANISTER BALANCE BEFORE==========="
CANISTER_BALANCE_BEFORE=$(dfx canister call icp_ledger_canister account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$CANISTER_ID'")]) + "}")')'})'| grep -o "e8s = [0-9_]*" | sed 's/e8s = //; s/_//g')
ICP_CANISTER_BALANCE_BEFORE=$(echo "scale=4; $CANISTER_BALANCE_BEFORE / 10^8" | bc)
CANISTER_CREDIT_BEFORE=$(dfx canister call FlipCoin_backend getHouseBalance | grep -o "[0-9_]*" | sed 's/_//g')
ICP_CANISTER_CREDIT_BEFORE=$(echo "scale=4; $CANISTER_CREDIT_BEFORE / 10^8" | bc)

echo ">Balance: $ICP_CANISTER_BALANCE_BEFORE ICP"
echo ">Credit: $ICP_CANISTER_CREDIT_BEFORE ICP"


# Call the rebalance function to track the newly deposited balance in the FlipCoin canister
echo ""
echo "===========REBALANCE BOOK==========="

dfx canister --identity default call FlipCoin_backend rebalanceBook

echo ""
echo "===========CANISTER BALANCE AFTER==========="
CANISTER_BALANCE_AFTER=$(dfx canister call icp_ledger_canister account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$CANISTER_ID'")]) + "}")')'})'| grep -o "e8s = [0-9_]*" | sed 's/e8s = //; s/_//g')
ICP_CANISTER_BALANCE_AFTER=$(echo "scale=4; $CANISTER_BALANCE_AFTER / 10^8" | bc)
CANISTER_CREDIT_AFTER=$(dfx canister call FlipCoin_backend getHouseBalance | grep -o "[0-9_]*" | sed 's/_//g')
ICP_CANISTER_CREDIT_AFTER=$(echo "scale=4; $CANISTER_CREDIT_AFTER / 10^8" | bc)

echo ">Balance: $ICP_CANISTER_BALANCE_AFTER ICP"
echo ">Credit: $ICP_CANISTER_CREDIT_AFTER ICP"

