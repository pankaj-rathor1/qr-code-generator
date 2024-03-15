

import { updateScanCountById } from "~/models/QRCode.server";

export const loader = async ({ params }:any) => {
    const id = Number(params.id);
    console.log(id);
    updateScanCountById(id);

    return null;
};
