export const depositTokens = async (identifiedActor) => {
    try {
        const deposit = await identifiedActor.depositIcp();
        return deposit;
    } catch (error) {
        return null;
    }
}