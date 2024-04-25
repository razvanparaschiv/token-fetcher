import {NextResponse} from 'next/server';
import {WalletSummaryValidation} from "@/validations/WalletValidation";
import {getWalletStats} from "@/services/WalletStats";

export const POST = async (request: Request) => {
    const json = await request.json();
    const parse = WalletSummaryValidation.safeParse(json);

    if (!parse.success) {
        return NextResponse.json(parse.error.format(), { status: 422 });
    }

    try {
        const result = await getWalletStats(parse.data.walletAddress);

        return NextResponse.json(result);
    } catch (error) {
        console.log(error);
        return NextResponse.json({}, { status: 500 });
    }
};
