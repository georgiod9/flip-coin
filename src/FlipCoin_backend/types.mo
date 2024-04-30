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
};
