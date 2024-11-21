import Array "mo:base/Array";
import IcpLedger "canister:icp_ledger_canister";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Principal "mo:base/Principal";

import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Random "mo:base/Random";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Bool "mo:base/Bool";

import Account "./Account";
import Int "mo:base/Int";
import Iter "mo:base/Iter";

import T "types";
import B "book";
import M "mo:base/HashMap";
import Types "types";
import H "house";
import G "getter";

shared (msg) actor class FlipCoin() = this {
  private stable var owner : Principal = msg.caller;

  private stable var _totalHistoricalBets : Nat = 0;
  private stable var _totalHistoricalWinnings : Nat = 0;

  let icp_fee : Nat = 10_000;
  let ledger : Principal = Principal.fromActor(IcpLedger);
  private stable var _entropyUsedCount : Nat = 0;
  private stable var _rewardMultiplier : Nat64 = 95;

  var icp_ledger_id : Principal = Principal.fromText("bkyz2-fmaaa-aaaaa-qaaaq-cai"); //DEV
  // var icp_ledger_id : Principal = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"); //PROD

  stable var _headsRate : Float = 0;
  stable var _headsCount : Nat = 0;

  stable var _tailsRate : Float = 0;
  stable var _tailsCount : Nat = 0;

  stable var lastFlipId : Nat = 0;

  private stable var flipHistoryEntries : [Types.Flip] = [];
  var flipHistory : Buffer.Buffer<Types.Flip> = Buffer.Buffer<Types.Flip>(0);

  private stable var book_stable : [(Principal, [(T.Token, Nat)])] = [];

  // User balance datastructure
  private var book = B.Book();
  private var house = H.House();
  private var getter = G.Getter();

  system func preupgrade() {
    Debug.print("Preupgrade: Preparing to sync flip history and book.");
    flipHistoryEntries := Buffer.toArray(flipHistory);
    book_stable := book.toStable();
  };

  system func postupgrade() {
    Debug.print("Postupgrade: Syncing flip history and book.");

    book.fromStable(book_stable);
    book_stable := [];

    flipHistory := Buffer.Buffer<Types.Flip>(flipHistoryEntries.size());
    for (flip in flipHistoryEntries.vals()) {
      flipHistory.add(flip);
    };
  };

  public shared (msg) func rebalanceBook() : async Bool {
    assert (msg.caller == owner);
    let canisterBalance = await getICPBalance();
    let cumulativeUserBalance = book.getUsersCumulativeBalance(Principal.fromActor(this), icp_ledger_id);
    switch (canisterBalance) {
      case (?balance) {
        var difference : Nat64 = (balance) - Nat64.fromNat(cumulativeUserBalance);
        var canisterCredits = await getHouseBalance();

        if (Nat64.toNat(difference) > canisterCredits) {
          var _newCredits = _addCredit(Principal.fromActor(this), icp_ledger_id, Nat64.toNat(difference) - canisterCredits);
          Debug.print("RebalanceBook: Canister ICP balance is greater than credits. Rebalancing.");
        };
        if (Nat64.toNat(difference) < canisterCredits) {
          var _newCredits = _removeCredit(Principal.fromActor(this), icp_ledger_id, canisterCredits - Nat64.toNat(difference));
          Debug.print("RebalanceBook: Canister ICP balance is less than credits. Rebalancing.");
        };
        if (Nat64.toNat(difference) == canisterCredits) {
          Debug.print("RebalanceBook: Canister ICP balance matches credits. Nothing to do.");
        };
        return true;
      };

      case (null) {
        Debug.print("RebalanceBook: Failed to get canister ICP balance.");
        return false;
      };
    };
  };

  // Set the owner of the canister
  public shared (msg) func setOwner(newOwner : Principal) : async Result.Result<Principal, Text> {
    assert (msg.caller == owner);
    owner := newOwner;
    #ok(newOwner);
  };

  /// Develop use only
  public shared (msg) func printBalances() {
    book.print_balances();
  };

  /// Develop use only
  public shared (msg) func getDepositPrincipal() : async Principal {
    return Principal.fromActor(this);
  };

  /// Develop use only
  public shared (msg) func getDepositAddressArray() : async [Nat8] {
    return await getter.getDepositAccountIdArray(Principal.fromActor(this), msg.caller);
  };

  /// Develop use only
  public func getOwner() : async Principal {
    return owner;
  };

  /// Develop use only
  public func getEntropyUsedCount() : async Nat {
    return _entropyUsedCount;
  };

  // Only Owner modifier
  private func isOwner(caller : Principal) : Bool {
    assert (caller == owner);
    return true;
  };

  public shared (msg) func adminClearBook() : async Result.Result<(Text), Text> {
    if (not isOwner(msg.caller)) {
      return #err("Only the owner can clear the book");
    };
    book.clear();
    Debug.print("Book cleared.");
    #ok("Book cleared.");
  };

  public shared ({ caller }) func setICPCanisterId(newId : Text) : async Result.Result<(), Text> {
    if (caller != owner) {
      return #err("Only the owner can set the ICP canister ID");
    };
    icp_ledger_id := Principal.fromText(newId);
    #ok();
  };

  // Returns available balance for house in book
  public func getHouseBalance() : async Nat {
    return book.fetchUserIcpBalance(Principal.fromActor(this), icp_ledger_id);
  };

  // Returns the caller's available credits in book
  public shared (msg) func getCredits() : async Nat {
    return book.fetchUserIcpBalance(msg.caller, icp_ledger_id);
  };

  public shared (msg) func getPendingDeposits() : async T.Tokens {
    return await getter.getPendingDeposits(Principal.fromActor(this), msg.caller);
  };

  public func getICPBalance() : async ?Nat64 {
    return await getter.getICPBalance(Principal.fromActor(this));
  };

  public func getICPLedgerId() : async Principal {
    return icp_ledger_id;
  };

  public func getLastFlipId() : async Nat {
    return lastFlipId;
  };

  public func getFlipHistory(start : Nat, end : Nat) : async [Types.Flip] {
    return await getter.getFlipHistory(flipHistory, start, end);
  };

  // Return the account ID specific to this user's subaccount
  public shared (msg) func getDepositAddress() : async Blob {
    return await getter.getDepositAccountId(Principal.fromActor(this), msg.caller);
  };

  public func getRewardsMultiplier() : async Nat64 {
    return _rewardMultiplier;
  };

  public shared (msg) func whoami() : async Principal {
    return msg.caller;
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

  // Change to private
  public shared func getCoinTossResult() : async Types.CoinTossResult {
    let randomBlob = await Random.blob();
    let toss = Random.Finite(randomBlob);

    switch (toss.coin()) {
      case (?result) {
        return {
          entropyBlob = randomBlob;
          result = result;
        };
      };
      case null {
        _entropyUsedCount += 1;
        Debug.print("Entropy used up: Coin toss failed. Retrying...");
        await getCoinTossResult();
      };
    };
  };

  // Make owner only
  // Develop only
  public func getHouseStatistics() : async T.HouseStatistics {
    let rewardsMultiplier = house.calculateRewardMultiplier(_totalHistoricalBets, _totalHistoricalWinnings);

    return {
      multiplier = Nat64.toNat(rewardsMultiplier);
      historicalBets = _totalHistoricalBets;
      historicalWinnings = _totalHistoricalWinnings;
    };
  };

  // After user transfers ICP to the target subaccount
  public shared (msg) func depositIcp() : async T.DepositReceipt {
    // Calculate target subaccount
    let source_account = Account.accountIdentifier(Principal.fromActor(this), Account.principalToSubaccount(msg.caller));

    let source_account_nat_array = Blob.toArray(source_account); // Comment out for vite build
    // let source_account_nat_array = source_account; // Uncomment for vite build

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

  private func deposit(from : Principal, balance : Nat64) : async T.DepositReceipt {
    let subAcc = Blob.toArray(Account.principalToSubaccount(from)); // Comment out for vite build
    // let subAcc = Account.principalToSubaccount(from); // Uncomment for vite build
    let destination_deposit_identifier = Account.accountIdentifier(Principal.fromActor(this), Account.defaultSubaccount());
    let destination = Blob.toArray(destination_deposit_identifier); // Comment out for vite build
    // let destination = destination_deposit_identifier; // Uncomment for vite build

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

    // Keep track of deposited ICP
    _addCredit(from, ledger, available.e8s);

    return #Ok(available.e8s);
  };

  // TODO Return receipt instead of text message
  public shared (msg) func submitFlip(bidSide : Bool, bidAmount_e8s : Nat64) : async Text {
    let ledgerId = await getICPLedgerId();
    let houseBalance = await getHouseBalance();

    // Ensure user has deposited funds
    if (not book.hasEnoughBalance(msg.caller, ledgerId, Nat64.toNat(bidAmount_e8s))) {
      return "Balance not enough. Please deposit funds to continue.";
    };

    // Update reward multiplier based on house balance
    _rewardMultiplier := house.calculateRewardMultiplier(_totalHistoricalBets, _totalHistoricalWinnings);

    // First layer of house protection
    // Check if house has enough coverage
    if (not house.hasCoverage(houseBalance, bidAmount_e8s, _rewardMultiplier) == true) {
      return "House coverage ratio too low. Please try a smaller bet.";
    };

    // Second layer of house protection
    // Check if bet exceeds max amount
    let maxBet = house.calculateMaxBet(houseBalance);
    if (bidAmount_e8s > maxBet) {
      return "Bet exceeds max limit of " # Float.toText(Float.fromInt(Nat64.toNat(maxBet)) / 100000000) # "ICP";
    };

    // Update historical bet amounts
    _totalHistoricalBets += Nat64.toNat(bidAmount_e8s);

    // Heads is true, Tails is false
    let flipResult = await getCoinTossResult();

    // Debug the outcome
    let outcome = if (flipResult.result) "Heads" else "Tails";
    Debug.print("Coin flip outcome: " # outcome);

    // Record flip after house validation
    await registerFlip(flipResult.entropyBlob, flipResult.result);

    // Evaluate round result
    // User lost - Decrease user amount in book by bet size
    // Increase canister amount in book by bet size
    if (bidSide != flipResult.result) {
      await _settleBetLoss(msg.caller, bidAmount_e8s);
      return "Sorry! You guessed wrong. The coin landed on " # outcome # ".";
    };
    // User won - Decrease amount in book by bet size
    // Decrease canister's amount in book by reward amount
    let _isSettled = await _settleBetWin(msg.caller, bidAmount_e8s);

    if (_isSettled) {
      return "Congratulations! You guessed right. The coin landed on " # outcome # ".";

    } else {
      return "Failed to transfer reward. Use the withdraw rewards method instead.";
    };

  };

  private func _settleBetWin(user : Principal, bidAmount_e8s : Nat64) : async Bool {
    let ledgerId = await getICPLedgerId();
    let totalReward = house.calculateReward(bidAmount_e8s, _rewardMultiplier);

    _totalHistoricalWinnings += Nat64.toNat(totalReward);

    let houseBalance = await getHouseBalance();

    Debug.print("Settling win. House balance: " # Nat.toText(houseBalance));
    if (houseBalance >= Nat64.toNat(totalReward)) {
      let _userBalance = _addCredit(user, ledgerId, Nat64.toNat(totalReward));
      let _canisterBalance = _removeCredit(Principal.fromActor(this), ledgerId, Nat64.toNat(totalReward));
      let debug_available_to_withdraw = book.fetchUserIcpBalance(user, icp_ledger_id);
      Debug.print("Available rewards for withdrawal: " # Nat.toText(debug_available_to_withdraw));
      // let _isTransferred = await _withdrawBid(user, totalReward);
      return true;
    } else {
      return false;
    };
  };

  private func _settleBetLoss(user : Principal, bidAmount_e8s : Nat64) : async () {
    let ledgerId = await getICPLedgerId();

    let _userBalance = _removeCredit(user, ledgerId, Nat64.toNat(bidAmount_e8s));
    let _canisterBalance = _addCredit(Principal.fromActor(this), ledgerId, Nat64.toNat(bidAmount_e8s));
  };

  // Increase deposited amount for `to` principal
  private func _addCredit(to : Principal, token : T.Token, amount : Nat) {
    book.addTokens(to, token, amount);
  };

  // Decrease deposited amount for `from` principal
  private func _removeCredit(from : Principal, token : T.Token, amount : Nat) : Nat {
    let newBalanceOpt = book.removeTokens(from, token, amount);
    switch (newBalanceOpt) {
      case (?newBalance) {
        Debug.print("User new balance: " # Principal.toText(from) # Nat.toText(newBalance));
        return newBalance;
      };
      case (null) {
        return 0;
      };
    };

  };

  public shared (msg) func withdrawRewards(amount : Nat) : async Types.WithdrawReceipt {
    return await _withdrawBid(msg.caller, amount);
  };

  private func _withdrawBid(to : Principal, withdrawAmount : Nat) : async Types.WithdrawReceipt {
    try {
      let amount = book.fetchUserIcpBalance(to, icp_ledger_id);

      if (withdrawAmount > amount) {
        return #Err(#InsufficientBalance);
      };

      let transferResult = await transfer({
        amount = { e8s = Nat64.fromNat(withdrawAmount) };
        toPrincipal = to;
        toSubaccount = null;
      });

      switch (transferResult) {
        case (#ok(blockIndex)) {
          let _userBalance = _removeCredit(to, icp_ledger_id, withdrawAmount);

          // If the transfer was successful, return true
          Debug.print("Reward transfer: " # Nat64.toText(Nat64.fromNat(withdrawAmount) / 100000000) # " to principal: " # Principal.toText(to) # ".");
          Debug.print("Remaining balance in book for " # Principal.toText(to) # Nat.toText(withdrawAmount / 100000000));
          return #Ok({
            blockIndex = blockIndex;
            amount = withdrawAmount;
          });
        };
        case (#err(errorMessage)) {
          // If there was an error, log it and return false
          Debug.print("Error during transfer: " # errorMessage);
          return #Err(#TransferFailure(errorMessage));
        };
      };

    } catch (error : Error) {
      // catch any errors that might occur during the transfer
      return #Err(#SystemError(Error.message(error)));
    };
  };

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

    // Update last flip count
    lastFlipId := lastFlipId + 1;
  };

  /// Develop use only / remove for production
  private func _blobToNat(blob : Blob) : Nat {
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

  private func _blobToHexString(blob : Blob) : Text {
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

  private func transfer(args : Types.TransferArgs) : async Result.Result<IcpLedger.BlockIndex, Text> {
    Debug.print(
      "Transferring "
      # debug_show (args.amount)
      # " tokens to principal "
      # debug_show (args.toPrincipal)
      # " subaccount "
      # debug_show (args.toSubaccount)
    );

    let destination_address = Blob.toArray(Principal.toLedgerAccount(args.toPrincipal, args.toSubaccount)); // Comment out for vite build
    // let destination_address = Principal.toLedgerAccount(args.toPrincipal, args.toSubaccount); // Uncomment for vite build

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
