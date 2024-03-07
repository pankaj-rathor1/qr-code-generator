import { Card, EmptyState, Layout, Page } from "@shopify/polaris";

import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";

import db from "../db.server";
import { getQRCodeImage } from "../models/QRCode.server";

export const loader = async ({ params }:any) => {
    console.log(params);

  const id: number = Number(params.id);
  const qrCode = await db.qRCode.findFirst({ where: { id } });

//   invariant(qrCode, "Could not find QR code destination");
    if(qrCode == null){
        return {};    
    }
    
    return json({
        title: qrCode.title,
        image: await getQRCodeImage(id),
    });
};

const EmptyQRCodeState = ({ onAction }:any) => (
    <EmptyState
      heading="QR Code Not Found"
      action={{
        content: "Create QR code",
        onAction,
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
    </EmptyState>
  );

export default function Index(){
    const {title, image} : any = useLoaderData();
    const navigate = useNavigate();
    return(
    <Page>
        <Layout>
            <Layout.Section>
                <Card>
                    { (title !== undefined && image !== undefined) ? (
                        <>
                        <h1>{title}</h1>
                        <img src={image} alt={`QR Code for product`} />
                        </>
                    ):(
                        <EmptyQRCodeState onAction={() => navigate("qrcodes/new")} />
                    )}
                    
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
    );
    
}