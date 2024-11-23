#!/usr/bin/env bash
dfx stop
set -e
trap 'dfx stop' EXIT

echo "===========SETUP========="
dfx start --background --clean
dfx deploy icp_ledger_canister --argument "(variant {
    Init = record {
      minting_account = \"$(dfx ledger --identity anonymous account-id)\";
      initial_values = vec {
        record {
          \"$(dfx ledger --identity default account-id)\";
          record {
            e8s = 150_000_000_000 : nat64;
          };
        };
      };
      send_whitelist = vec {};
      transfer_fee = opt record {
        e8s = 10_000 : nat64;
      };
      token_symbol = opt \"LICP\";
      token_name = opt \"Local ICP\";
    }
  })
"

#Get balance of deafult identity
dfx canister call icp_ledger_canister account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$(dfx ledger --identity default account-id)'")]) + "}")')'})'
echo "===========SETUP DONE========="

dfx deploy FlipCoin_backend


TARGET_DEPOSIT_ADDRESS_BYTES="$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$TARGET_DEPOSIT_ADDRESS'")]) + "}")')"

#vec{97;21;174;75;165;97;168;108;209;103;193;253;108;15;55;98;57;71;133;33;127;235;203;249;203;7;155;242;78;7;125;172}
TARGET_DEPOSIT_ADDRESS_BYTES="vec{97;21;174;75;165;97;168;108;209;103;193;253;108;15;55;98;57;71;133;33;127;235;203;249;203;7;155;242;78;7;125;172}"


TOKENS_TRANSFER_ACCOUNT_ID="$(dfx ledger account-id --of-canister FlipCoin_backend)"
TOKENS_TRANSFER_ACCOUNT_ID_BYTES="$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$TOKENS_TRANSFER_ACCOUNT_ID'")]) + "}")')"

# Transfer tokens from default to flipcoin contract
dfx canister --identity default call icp_ledger_canister transfer "(record { to = ${TOKENS_TRANSFER_ACCOUNT_ID_BYTES}; memo = 1; amount = record { e8s = 2_000_000_000 }; fee = record { e8s = 10_000 }; })"

# transfer to user dev 1 id: 10000 principal: dx6vz-vhqey-xdj7o-k4mbs-5x76l-7gst4-aee6m-rfalm-bqams-gjkd3-fae
DEV2_ACCOUNT_PRINCIPAL="dx6vz-vhqey-xdj7o-k4mbs-5x76l-7gst4-aee6m-rfalm-bqams-gjkd3-fae"
DEV1_ACCOUNT_PRINCIPAL="s7rkk-6yycj-tys5p-7wbqa-hrs62-25tww-4skdd-woom6-o4qsu-godbi-aqe"


dfx canister call FlipCoin_backend transfer "(record { amount = record { e8s = 100_000_000 }; toPrincipal = principal \"${DEV1_ACCOUNT_PRINCIPAL}\"})"


dfx canister call FlipCoin_backend transfer "(record { amount = record { e8s = 100_000_000 }; toPrincipal = principal \"$(dfx identity --identity default get-principal)\"})"

echo "DONE"

#Get account balance of contract
dfx canister call icp_ledger_canister account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$(dfx ledger account-id --of-canister FlipCoin_backend)'")]) + "}")')'})'


LEDGER_CANISTER_ID=""
dfx canister --identity default call  FlipCoin_backend setICPCanisterId '("bkyz2-fmaaa-aaaaa-qaaaq-cai")'

#Get user's deposit address
dfx canister call FlipCoin_backend getDepositAddress --identity default
dfx canister call FlipCoin_backend getDepositAddressArray --identity default


#Playing a round step 1 (in client code)
dfx canister --identity default call icp_ledger_canister transfer "(record { to = ${TARGET_DEPOSIT_ADDRESS_BYTES}; memo = 1; amount = record { e8s = 100_000_000 }; fee = record { e8s = 10_000 }; })"
#Playing a round step 2 (on contract)
dfx canister --identity default call FlipCoin_backend depositIcp '()'
#Playing a round step 3 (on contract)
dfx canister --identity default call FlipCoin_backend submitFlip '(true,10000000)' 