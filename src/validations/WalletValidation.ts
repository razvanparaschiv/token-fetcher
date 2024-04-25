import {z} from 'zod';
import {isAddress} from "ethers";

const Address = z.custom<string>(isAddress, "Invalid Address")

export const WalletSummaryValidation = z.object({
    walletAddress: Address.transform(a => a.toLowerCase()),
});
