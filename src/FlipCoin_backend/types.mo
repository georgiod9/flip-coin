module {
    public type Token = Principal;

    public type DepositReceipt = {
        #Ok : Nat;
        #Err : DepositErr;
    };

    public type DepositErr = {
        #BalanceLow;
        #TransferFailure;
    };

    public type Tokens = {
        e8s : Nat64;
    };
    public type Message = {
        caller : Principal;
    };

    public type TransferArgs = {
        amount : Tokens;
        toPrincipal : Principal;
        toSubaccount : ?Blob;
    };

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

    public type CoinTossResult = {
        result : Bool;
        entropyBlob : Blob;
    };

    public type Statistics = {
        tailsRate : Float;
        tailsCount : Int;
        headsRate : Float;
        headsCount : Int;
    };

    public type HouseStatistics = {
        multiplier : Nat;
        historicalBets : Nat;
        historicalWinnings : Nat;
    };

    public type TransactionNotification = {
        fromPrincipal : Principal;
        amount : Nat64; // Amount in e8s
        memo : Nat64;
    };

    public type WithdrawError = {
        #InsufficientBalance;
        #TransferFailure : Text;
        #SystemError : Text;
    };

    public type WithdrawReceipt = {
        #Ok : {
            blockIndex : Nat64;
            amount : Nat;
        };
        #Err : WithdrawError;
    };

};
