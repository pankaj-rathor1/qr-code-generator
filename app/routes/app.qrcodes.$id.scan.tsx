

import db from "../db.server";
import invariant from "tiny-invariant";

export const loader = async ({ params }:any) => {
    // invariant(params.id, "Could not find QR code destination");

    const id = Number(params.id);
    console.log(id);
    const qrCode:any = await db.qRCode.findFirst({ where: { id } });

    invariant(qrCode, "Could not find QR code destination");

    await db.qRCode.update({
        where: { id },
        data: { scans: { increment: 1 } },
    });

    return null;
};
