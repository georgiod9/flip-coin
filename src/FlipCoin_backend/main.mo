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
import Types "types";

shared (msg) actor class FlipCoin() = this {
  // stable var owner : Principal = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
  private var owner : Principal = msg.caller;
  Debug.print(debug_show ("OWNER: ", owner));

  let icp_fee : Nat = 10_000;
  let ledger : Principal = Principal.fromActor(IcpLedger);
  var entropyUsedCount : Nat = 0;

  var icp_ledger_id : Principal = Principal.fromText("bkyz2-fmaaa-aaaaa-qaaaq-cai"); //DEV
  // var icp_ledger_id : Principal = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"); //PROD

  var _headsRate : Float = 0;
  var _headsCount : Nat = 0;

  var _tailsRate : Float = 0;
  var _tailsCount : Nat = 0;

  var lastFlipId : Nat = 0;

  var flipHistory : Buffer.Buffer<Types.Flip> = Buffer.Buffer<Types.Flip>(0);

  // User balance datastructure
  private var book = B.Book();
  // private stable var book_stable : [var (Principal, [(T.Token, Nat)])] = [var];

  private var funder : Principal = Principal.fromText("b4nbh-fwspd-e6ep6-2izbs-5tydj-nidz2-jllq2-zxfl2-33oe6-j4bnn-5qe");
  private var totalFunds : Nat = 0;

  /// Develop use only
  public shared (msg) func printBalances() {
    if (isOwner(msg.caller)) {
      book.print_balances();
    } else {
      Debug.print("You are not authorized to print the balances.");
    };
  };

  /// Develop use only
  public shared (msg) func getDepositPrincipal() : async Principal {
    return Principal.fromActor(this);
  };

  /// Develop use only
  // Return the account ID specific to this user's subaccount
  public shared (msg) func getDepositAddressArray() : async [Nat8] {
    let accountIdentifier = Account.accountIdentifier(Principal.fromActor(this), Account.principalToSubaccount(msg.caller));
    let accountIdentifierArray = Blob.toArray(accountIdentifier);
    return accountIdentifierArray;
  };

  /// Develop use only
  public func getOwner() : async Principal {
    return owner;
  };

  /// Develop use only
  public func getEntropyUsedCount() : async Nat {
    return entropyUsedCount;
  };

  // Set the owner of the canister
  public shared (msg) func setOwner(newOwner : Principal) : async Result.Result<Principal, Text> {
    assert (msg.caller == owner);
    owner := newOwner;
    #ok(newOwner);
  };

  // Only Owner modifier
  private func isOwner(caller : Principal) : Bool {
    assert (caller == owner);
    return true;
  };

  public shared (msg) func retrieveAccountBalance() : async Nat {

    let userBalance = book.fetchUserIcpBalance(msg.caller, icp_ledger_id);
    Debug.print(Principal.toText(msg.caller) # " ICP balance: " # Nat.toText(userBalance));
    return userBalance;
  };

  public shared (msg) func adminClearBook() : async Result.Result<(Text), Text> {
    if (not isOwner(msg.caller)) {
      return #err("Only the owner can clear the book");
    };
    book.clear();
    Debug.print("Book cleared.");
    #ok("Book cleared.");
  };

  public func getICPBalance() : async ?Nat64 {
    let accountPrincipal = Principal.fromActor(this);
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

  public shared ({ caller }) func setICPCanisterId(newId : Text) : async Result.Result<(), Text> {
    if (caller != owner) {
      return #err("Only the owner can set the ICP canister ID");
    };
    icp_ledger_id := Principal.fromText(newId);
    #ok();
  };

  public func getICPLedgerId() : async Principal {
    return icp_ledger_id;
  };

  public func getStatistics() : async Types.Statistics {
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

  public func getFlipHistory(start : Nat, end : Nat) : async [Types.Flip] {
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

  // Return the account ID specific to this user's subaccount
  public shared (msg) func getDepositAddress() : async Blob {
    let accountIdentifier = Account.accountIdentifier(Principal.fromActor(this), Account.principalToSubaccount(msg.caller));
    return accountIdentifier;
  };

  public shared (msg) func whoami() : async Principal {
    return msg.caller;
  };

  public shared func getCoinTossResult() : async Types.CoinTossResult {
    let randomBlob = await Random.blob();
    Debug.print("Random blob:" # blobToHexString(randomBlob));
    let toss = Random.Finite(randomBlob);

    switch (toss.coin()) {
      case (?result) {
        return {
          entropyBlob = randomBlob;
          result = result;
        };
      };
      case null {
        entropyUsedCount += 1;
        Debug.print("Entropy used up: Coin toss failed. Retrying...");
        await getCoinTossResult();
      };
    };
  };

  /// Develop use only / remove for production
  public shared func generateSecureRandomNumber(min : Nat, max : Nat) : async Types.RandomGeneratorResult {
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

  private func deposit(from : Principal, balance : Nat64) : async T.DepositReceipt {

    Debug.print("Principal of depositer:" # Principal.toText(from));

    let subAcc = Blob.toArray(Account.principalToSubaccount(from));

    let destination_deposit_identifier = Account.accountIdentifier(Principal.fromActor(this), Account.defaultSubaccount());

    let destination = Blob.toArray(destination_deposit_identifier);

    // Transfer to default subaccount
    let icp_receipt = if (Nat64.toNat(balance) > icp_fee) {
      await IcpLedger.transfer({
        memo : Nat64 = 0;
        from_subaccount = ?subAcc;
        to = destination;
        amount = { e8s = balance - Nat64.fromNat(icp_fee) };
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
    let available = { e8s : Nat = Nat64.toNat(balance) - icp_fee };

    Debug.print("Principal: " # Principal.toText(from));
    Debug.print("Available: " # Nat.toText(available.e8s));

    // keep track of deposited ICP
    addCredit(from, ledger, available.e8s);

    return #Ok(available.e8s);
  };

  // After user transfers ICP to the target subaccount
  public shared (msg) func depositIcp() : async T.DepositReceipt {

    // Calculate target subaccount
    let source_account = Account.accountIdentifier(Principal.fromActor(this), Account.principalToSubaccount(msg.caller));

    let source_account_nat_array = Blob.toArray(source_account);
    // let source_account_nat_array = source_account;

    // Check ledger for value
    let balance = await IcpLedger.account_balance({
      account = source_account_nat_array;
    });

    let result = await deposit(msg.caller, balance.e8s);
    switch result {
      case (#Ok(available)) {
        return #Ok(available);
      };
      case (#Err(error)) {
        return #Err(error);
      };
    };
  };

  private func addCredit(to : Principal, token : T.Token, amount : Nat) {
    book.addTokens(to, token, amount);
    totalFunds := totalFunds + amount;
  };

  private func removeCredit(from : Principal, token : T.Token, amount : Nat) : Nat {
    let newBalanceOpt = book.removeTokens(from, token, amount);
    switch (newBalanceOpt) {
      case (?newBalance) {

        // Adjust canister funds
        totalFunds := totalFunds - amount;
        Debug.print("Removed " # Nat.toText(amount) # "from canister funds.");
        Debug.print("User new balance " # Nat.toText(newBalance));
        return newBalance;
      };
      case (null) {
        return 0;
      };
    };

  };

  public shared (msg) func submitFlip(bidSide : Bool, bidAmount_e8s : Nat64) : async Text {

    let ledgerId = await getICPLedgerId();
    if (not book.hasEnoughBalance(msg.caller, ledgerId, Nat64.toNat(bidAmount_e8s))) {
      return "Balance not enough. Please deposit funds to continue.";
    };

    // Heads is true, Tails is 1 false
    let flipResult = await getCoinTossResult();

    // Debug the outcome
    let outcome = if (flipResult.result) "Heads" else "Tails";
    Debug.print("Coin flip outcome: " # outcome);

    await registerFlip(flipResult.entropyBlob, flipResult.result);

    // Update last flip count
    lastFlipId := lastFlipId + 1;

    let houseBalanceOpt = await getICPBalance();
    switch (houseBalanceOpt) {
      case (?houseBalance) {
        // Evaluate round result
        let newBalance = book.removeTokens(msg.caller, ledgerId, Nat64.toNat(bidAmount_e8s));

        if (bidSide != flipResult.result) {
          return "Sorry! You guessed wrong. The coin landed on " # outcome # ".";
        };

        let rewardTransferResult = await withdrawBid(bidAmount_e8s, msg.caller);

        if (rewardTransferResult) {
          return "Congratulations! You guessed right. The coin landed on " # outcome # ".";

        } else {
          return "Failed to transfer reward. Use the withdraw rewards method instead.";
        };

      };
      case (null) {
        return "Unable to retrieve house balance. Retrieve credits using withdraw rewards method.";
      };
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

  private func withdrawBid(bidAmount_e8s : Nat64, to : Principal) : async Bool {

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
  private func registerFlip(blob : Blob, result : Bool) : async () {
    let currentTimestamp : Int = Time.now();
    let newFlip : Types.Flip = {
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

  /// Develop use only / remove for production
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

  public shared (msg) func adminDeposit(amount : Nat64) : async T.DepositReceipt {
    // Calculate target subaccount
    let source_account = Account.accountIdentifier(Principal.fromActor(this), Account.principalToSubaccount(funder));

    let source_account_nat_array = Blob.toArray(source_account);
    // let source_account_nat_array = source_account;

    // Check ledger for value
    let balance = await IcpLedger.account_balance({
      account = source_account_nat_array;
    });

    Debug.print("Balance of sender: " # Nat64.toText(balance.e8s));

    let result = await deposit(funder, amount);
    switch result {
      case (#Ok(available)) {
        return #Ok(available);
      };
      case (#Err(error)) {
        return #Err(error);
      };
    };

  };

  private func transfer(args : Types.TransferArgs) : async Result.Result<IcpLedger.BlockIndex, Text> {
    Debug.print(
      "Transferring "
      # debug_show (args.amount)
      # " tokens to principal "
      # debug_show (args.toPrincipal)
      # " subaccount "
      # debug_show (args.toSubaccount)
    );

    let destination_address = Blob.toArray(Principal.toLedgerAccount(args.toPrincipal, args.toSubaccount));
    // let destination_address = Principal.toLedgerAccount(args.toPrincipal, args.toSubaccount);

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
