// Import necessary modules and define types/interfaces

import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";

// Define interfaces for QRCode and Product
interface QRCode {
  id: string;
  productId: string;
  productHandle: string;
  productVariantId: string;
  shop: string;
  destination: string;
}

interface Product {
  title?: string;
  images?: {
    nodes: {
      altText?: string;
      url?: string;
    }[];
  };
}

// Function to get a single QRCode by ID
export async function getQRCode(id: number, graphql: any): Promise<QRCode | null> {
  const qrCode:any = await db.qRCode.findFirst({ where: { id } });

  if (!qrCode) {
    return null;
  }
  
  return supplementQRCode(qrCode, graphql);
}

// Function to get multiple QRCode by shop
export async function getQRCodes(shop: string, graphql: any): Promise<QRCode[]> {
  const qrCodes:any = await db.qRCode.findMany({
    // where: { shop },
    orderBy: { id: "desc" },
  });

  if (qrCodes.length === 0) return [];

  return Promise.all(
    qrCodes.map((qrCode:any) => supplementQRCode(qrCode, graphql))
  );
}

// Function to get the QRCode image data URL
export function getQRCodeImage(id: number|string): Promise<string> {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL!);
  return qrcode.toDataURL(url.href);
}

// Function to get the destination URL based on QRCode destination
export function getDestinationUrl(qrCode: QRCode): string {
  return `https://${qrCode.shop}/products/${qrCode.productHandle}`; //please remove
  
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(qrCode.productVariantId);
  // invariant(match, "Unrecognized product variant ID");

  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

// Function to supplement QRCode data with product information
async function supplementQRCode(qrCode: QRCode, graphql: any): Promise<QRCode & { productDeleted: boolean; productTitle?: string; productImage?: string; productAlt?: string; image: string }> {
  const qrCodeImagePromise = getQRCodeImage(qrCode.id);

  const response = await graphql(
    `
      query supplementQRCode($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: qrCode.productId
      },
    }
  );

  const {
    data: { product },
  } = await response.json();

  return {
    ...qrCode,
    productDeleted: !product?.title,
    productTitle: product?.title,
    productImage: product?.images?.nodes[0]?.url,
    productAlt: product?.images?.nodes[0]?.altText,
    destination: getDestinationUrl(qrCode),
    image: await qrCodeImagePromise,
  };
}

// Function to validate QRCode data
export function validateQRCode(data: { title?: string; productId?: string; destination?: string }): { [key: string]: string } | null {
  const errors: { [key: string]: string } = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (!data.destination) {
    errors.destination = "Destination is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }

  return null;
}
