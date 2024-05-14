import IcpLedger "canister:icp_ledger_canister";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Random "mo:base/Random";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import Bool "mo:base/Bool";

import Account "./Account";
import Int "mo:base/Int";

import T "types";
import B "book";
import M "mo:base/HashMap";

// import IC "mo:base/IC";

actor FlipCoin {
  type Tokens = {
    e8s : Nat64;
  };
  type Message = {
    caller : Principal;
  };

  type TransferArgs = {
    amount : Tokens;
    toPrincipal : Principal;
    toSubaccount : ?Blob;
  };

  let icp_fee : Nat = 10_000;
  let ledger : Principal = Principal.fromActor(IcpLedger);

  var icp_ledger_id : Principal = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");

  var _headsRate : Float = 0;
  var _headsCount : Nat = 0;

  var _tailsRate : Float = 0;
  var _tailsCount : Nat = 0;

  var lastFlipId : Nat = 0;
  var cell : Int = 0;
  // var flipHistory : [Flip] = [];
  var flipHistory : Buffer.Buffer<Flip> = Buffer.Buffer<Flip>(0);

  // User balance datastructure
  private var book = B.Book();
  private stable var book_stable : [var (Principal, [(T.Token, Nat)])] = [var];

  type DepositArgs = {
    amount : Tokens;
  };

  public type Flip = {
    timestamp : Int; // Unix timestamp in milliseconds
    entropyBlob : Blob; // The random blob used for the flip
    result : Bool; // The outcome of the flip (true for heads, false for tails)
  };

  public type RandomGeneratorResult = {
    scaledRandomNumber : Nat;
    entropyBlob : Blob;
  };

  public type Statistics = {
    tailsRate : Float;
    tailsCount : Int;
    headsRate : Float;
    headsCount : Int;
  };

  public type TransactionNotification = {
    fromPrincipal : Principal;
    amount : Nat64; // Amount in e8s
    memo : Nat64;
  };

  // private func canisterDefaultAccount() : Blob {
  //   Account.accountIdentifier(Principal.fromActor(FlipCoin), Account.defaultSubaccount());
  // };

  // public query func getCanisterAccount() : async Blob {
  //   canisterDefaultAccount();
  // };

  public func getICPBalance() : async ?Nat64 {
    let accountPrincipal = Principal.fromActor(FlipCoin);
    // Convert principal to account id
    let accountIdentifier = await IcpLedger.account_identifier({
      owner = accountPrincipal;
      subaccount = null;
    });

    // Make inter canister call for balance
    let balanceResult = await IcpLedger.account_balance({
      account = accountIdentifier;
    });

    // Return the balance in e8s (1 ICP = 1e8 e8s).
    return ?balanceResult.e8s;
  };

  public func setICPCanisterId(newId : Text) {
    icp_ledger_id := Principal.fromText(newId);
  };

  public func getICPLedgerId() : async Principal {
    return icp_ledger_id;
  };

  // Clear
  public func clearall() : async () {
    cell := 0;
  };

  public func getStatistics() : async Statistics {
    return {
      tailsRate = _tailsRate;
      tailsCount = _tailsCount;
      headsRate = _headsRate;
      headsCount = _headsCount;
    };
  };

  public shared (msg) func getSelfBalance() : async Nat {
    switch (book.get(msg.caller)) {
      case (?token_balance) {
        let token = await getICPLedgerId();

        switch (token_balance.get(token)) {
          case (?balance) {
            return balance;
          };
          case (null) {
            return 0;
          };
        };
      };
      case (null) {
        return 0;
      };
    };
  };

  public func getLastFlipId() : async Nat {
    return lastFlipId;
  };

  public func getFlipHistory(start : Nat, end : Nat) : async [Flip] {
    let size = flipHistory.size();
    let validStart = Nat.max(0, start);
    let validEnd = Nat.min(size, end); // Ensure validEnd is within bounds

    var flips : [Flip] = [];

    for (i in Iter.range(validStart, validEnd - 1)) {
      let flipOpt = flipHistory.get(i);
      flips := Array.append(flips, [flipOpt]);
    };

    return flips;
  };

  // Return the account ID specific to this user's subaccount
  public shared (msg) func getDepositAddress() : async Blob {
    let accountIdentifier = Account.accountIdentifier(Principal.fromActor(FlipCoin), Account.principalToSubaccount(msg.caller));
    return accountIdentifier;
  };

  public shared (msg) func getDepositAddressArray() : async [Nat8] {
    let accountIdentifier = Account.accountIdentifier(Principal.fromActor(FlipCoin), Account.principalToSubaccount(msg.caller));
    let accountIdentifierArray = Blob.toArray(accountIdentifier);
    return accountIdentifierArray;
  };

  public shared (msg) func whoami() : async Principal {
    return msg.caller;
  };

  public func printBalances() {

    book.print_balances();
  };

  public shared func generateSecureRandomNumber(min : Nat, max : Nat) : async RandomGeneratorResult {
    assert (min < max);

    // Calculate the range width
    let range = max - min + 1;

    // Generate a random number using Random.blob
    let randomBlob = await Random.blob();

    let blobString = blobToHexString(randomBlob);

    Debug.print("Blob: " # blobString);

    // Convert the random blob to a Nat
    let randomNumber = blobToNat(randomBlob);

    // Scale the random number to the desired range
    let scaledRandomNumber = (randomNumber % range) + min;

    return {
      scaledRandomNumber = scaledRandomNumber;
      entropyBlob = randomBlob;
    };
  };

  // After user transfers ICP to the target subaccount
  public shared (msg) func depositIcp() : async T.DepositReceipt {

    Debug.print("Principal of user:" # Principal.toText(msg.caller));

    // Calculate target subaccount
    let source_account = Account.accountIdentifier(Principal.fromActor(FlipCoin), Account.principalToSubaccount(msg.caller));

    let source_account_nat_array = Blob.toArray(source_account);
    // Check ledger for value
    let balance = await IcpLedger.account_balance({
      account = source_account_nat_array;
    });

    let subAcc = Blob.toArray(Account.principalToSubaccount(msg.caller));

    let destination_deposit_identifier = Account.accountIdentifier(Principal.fromActor(FlipCoin), Account.defaultSubaccount());
    let destination = Blob.toArray(destination_deposit_identifier);
    // Transfer to default subaccount
    let icp_receipt = if (Nat64.toNat(balance.e8s) > icp_fee) {
      await IcpLedger.transfer({
        memo : Nat64 = 0;
        from_subaccount = ?subAcc;
        to = destination;
        amount = { e8s = balance.e8s - Nat64.fromNat(icp_fee) };
        fee = { e8s = Nat64.fromNat(icp_fee) };
        created_at_time = ?{
          timestamp_nanos = Nat64.fromNat(Int.abs(Time.now()));
        };
      });
    } else {
      return #Err(#BalanceLow);
    };

    switch icp_receipt {
      case (#Err _) {
        return #Err(#TransferFailure);
      };
      case _ {};
    };
    let available = { e8s : Nat = Nat64.toNat(balance.e8s) - icp_fee };

    Debug.print("Principal: " # Principal.toText(msg.caller));
    Debug.print("Available: " # Nat.toText(available.e8s));

    // keep track of deposited ICP
    book.addTokens(msg.caller, ledger, available.e8s);

    // Return result
    #Ok(available.e8s);
  };

  public shared (msg) func submitFlip(bidSide : Bool, bidAmount_e8s : Nat64) : async Text {

    let ledgerId = await getICPLedgerId();
    if (book.hasEnoughBalance(msg.caller, ledgerId, Nat64.toNat(bidAmount_e8s))) {
      // Heads is 0 (true), Tails is 1 (false)
      let flipResultNat = await generateSecureRandomNumber(0, 1);
      let flipResultBool = flipResultNat.scaledRandomNumber == 0;

      // Debug the outcome
      let outcome = if (flipResultBool) "Heads" else "Tails";
      Debug.print("Coin flip outcome: " # outcome);

      await registerFlip(flipResultNat.entropyBlob, flipResultBool);

      // Update last flip count
      lastFlipId := lastFlipId + 1;

      // Evaluate round result
      if (bidSide == flipResultBool) {
        let isPaid = await withdrawReward(bidAmount_e8s, msg.caller);

        // User wins
        return "Congratulations! You guessed right. The coin landed on " # outcome # ".";
      } else {
        // User loses
        // Update user balance records
        let ledgerId = await getICPLedgerId();

        let newBalance = book.removeTokens(msg.caller, ledgerId, Nat64.toNat(bidAmount_e8s));

        return "Sorry! You guessed wrong. The coin landed on " # outcome # ".";
      };
    } else {
      return "Balance not enough. Please deposit funds to continue.";
    };

  };

  // Transfer user reward
  private func withdrawReward(bidAmount_e8s : Nat64, to : Principal) : async Bool {

    try {
      let reward = bidAmount_e8s + (bidAmount_e8s * 95) / 100;

      let transferResult = await transfer({
        amount = { e8s = reward };
        toPrincipal = to;
        toSubaccount = null;
      });

      switch (transferResult) {
        case (#ok(blockIndex)) {
          // If the transfer was successful, return true
          Debug.print("Reward transfer: " # Nat64.toText(reward) # " to principal: " # Principal.toText(to) # ".");

          let ledgerId = await getICPLedgerId();
          // Update user balance records
          let newBalance = book.removeTokens(to, ledgerId, Nat64.toNat(bidAmount_e8s));
          return true;
        };
        case (#err(errorMessage)) {
          // If there was an error, log it and return false
          Debug.print("Error during transfer: " # errorMessage);
          return false;
        };
      };

    } catch (error : Error) {
      // catch any errors that might occur during the transfer
      return false;
    };

    return true;
  };

  private func depositBid(bidAmount_e8s : Nat64, to : Principal) : async Bool {

    try {
      let reward = (bidAmount_e8s * 95) / 100;

      let transferResult = await transfer({
        amount = { e8s = reward };
        toPrincipal = to;
        toSubaccount = null;
      });

      switch (transferResult) {
        case (#ok(blockIndex)) {
          // If the transfer was successful, return true
          Debug.print("Reward transfer: " # Nat64.toText(bidAmount_e8s / 100000000) # " to principal: " # Principal.toText(to) # ".");
          return true;
        };
        case (#err(errorMessage)) {
          // If there was an error, log it and return false
          Debug.print("Error during transfer: " # errorMessage);
          return false;
        };
      };

    } catch (error : Error) {
      // catch any errors that might occur during the transfer
      return false;
    };

    return true;
  };

  // Add flip to history
  public func registerFlip(blob : Blob, result : Bool) : async () {
    let currentTimestamp : Int = Time.now();
    let newFlip : Flip = {
      timestamp = currentTimestamp;
      entropyBlob = blob;
      result = result;
    };

    if (result == true) {
      _headsCount := _headsCount + 1;
    } else {
      _tailsCount := _tailsCount + 1;
    };

    let headsRateFloat : Float = Float.fromInt(_headsCount) * 100.0 / Float.fromInt(_headsCount + _tailsCount);
    let tailsRateFloat : Float = Float.fromInt(_tailsCount) * 100.0 / Float.fromInt(_headsCount + _tailsCount);
    _headsRate := headsRateFloat;
    _tailsRate := tailsRateFloat;

    // Add the new flip to the history
    flipHistory.add(newFlip);
  };

  private func blobToNat(blob : Blob) : Nat {
    let nat8Array = Blob.toArray(blob);
    let result = Array.foldLeft<Nat8, Nat>(
      nat8Array,
      0,
      func(acc : Nat, i : Nat8) : Nat {
        acc * 256 + Nat8.toNat(i);
      },
    );
    return result;
  };

  func blobToHexString(blob : Blob) : Text {
    let hexChars : [Text] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    let bytes = Blob.toArray(blob);
    let hexString = Array.foldLeft<Nat8, Text>(
      bytes,
      "",
      func(acc : Text, byte : Nat8) : Text {
        let highIndex = Nat8.toNat(byte) / 16;
        let lowIndex = Nat8.toNat(byte) % 16;
        let high = hexChars[highIndex];
        let low = hexChars[lowIndex];
        acc # high # low;
      },
    );
    return hexString;
  };

  public shared ({ caller }) func transfer(args : TransferArgs) : async Result.Result<IcpLedger.BlockIndex, Text> {
    Debug.print(
      "Transferring "
      # debug_show (args.amount)
      # " tokens to principal "
      # debug_show (args.toPrincipal)
      # " subaccount "
      # debug_show (args.toSubaccount)
    );

    let destination_address = Blob.toArray(Principal.toLedgerAccount(args.toPrincipal, args.toSubaccount));
    let transferArgs : IcpLedger.TransferArgs = {
      // can be used to distinguish between transactions
      memo = 0;
      // the amount we want to transfer
      amount = args.amount;
      // the ICP ledger charges 10_000 e8s for a transfer
      fee = { e8s = 10_000 };
      // we are transferring from the canisters default subaccount, therefore we don't need to specify it
      from_subaccount = null;
      // we take the principal and subaccount from the arguments and convert them into an account identifier
      to = destination_address;
      // a timestamp indicating when the transaction was created by the caller; if it is not specified by the caller then this is set to the current ICP time
      created_at_time = null;
    };

    try {
      // initiate the transfer
      let transferResult = await IcpLedger.transfer(transferArgs);

      // check if the transfer was successfull
      switch (transferResult) {
        case (#Err(transferError)) {
          return #err("Couldn't transfer funds:\n" # debug_show (transferError));
        };
        case (#Ok(blockIndex)) { return #ok blockIndex };
      };
    } catch (error : Error) {
      // catch any errors that might occur during the transfer
      return #err("Reject message: " # Error.message(error));
    };
  };
};
