#!/usr/bin/env bash
# This script performs an admin deposit of ICP tokens to the FlipCoin canister
# It does the following:
# 1. Shows the depositor (default identity) principal and balance
# 2. Shows the canister principal and account ID
# 3. Shows the canister's ICP balance and credit balance before deposit 
# 4. Transfers 1 ICP from default identity to the canister
# 5. Shows updated balances after deposit

# Usage:
# ./admin_deposit.sh

# Requirements:
# - dfx must be installed and running
# - User must have default identity with ICP balance
# - FlipCoin_backend canister must be deployed
# - icp_ledger_canister must be deployed

echo "===========ADMIN DEPOSIT==========="

# Get depositor principal and balance
echo ""
echo "===========DEPOSITOR==========="
PRINCIPAL=$(dfx identity --identity default get-principal)
ACCOUNT_ID=$(dfx ledger account-id --of-principal $PRINCIPAL)
BALANCE=$(dfx canister call icp_ledger_canister account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$ACCOUNT_ID'")]) + "}")')'})'| grep -o "e8s = [0-9_]*" | sed 's/e8s = //; s/_//g')
ICP_BALANCE=$(echo "scale=4; $BALANCE / 10^8" | bc)

echo ">Principal: $PRINCIPAL"
echo ">Balance: $ICP_BALANCE ICP"

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

# Deposit 1 ICP from default identity to FlipCoin canister using the ledger canister
echo ""
echo "===========DEPOSITING==========="
DEPOSIT_AMOUNT_ICP=1
DEPOSIT_AMOUNT_E8S=$(echo "$DEPOSIT_AMOUNT_ICP * 10^8" | bc)
dfx canister --identity default call icp_ledger_canister transfer "(record { to = ${CANISTER_ID_IN_BYTES}; memo = 1; amount = record { e8s = $DEPOSIT_AMOUNT_E8S }; fee = record { e8s = 10_000 }; })"

# Get FlipCoin canister balance after the admin deposit
echo ""
echo "===========CANISTER BALANCE AFTER==========="
CANISTER_BALANCE_AFTER=$(dfx canister call icp_ledger_canister account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$CANISTER_ID'")]) + "}")')'})'| grep -o "e8s = [0-9_]*" | sed 's/e8s = //; s/_//g')
ICP_CANISTER_BALANCE_AFTER=$(echo "scale=4; $CANISTER_BALANCE_AFTER / 10^8" | bc)
CANISTER_CREDIT_AFTER=$(dfx canister call FlipCoin_backend getHouseBalance | grep -o "[0-9_]*" | sed 's/_//g')
ICP_CANISTER_CREDIT_AFTER=$(echo "scale=4; $CANISTER_CREDIT_AFTER / 10^8" | bc)

echo ">Balance: $ICP_CANISTER_BALANCE_AFTER ICP"
echo ">Credit: $ICP_CANISTER_CREDIT_AFTER ICP"

# Call the rebalance function to track the newly deposited balance in the FlipCoin canister
echo ""
echo "===========REBALANCE BOOK==========="

dfx canister --identity default call FlipCoin_backend rebalanceBook
