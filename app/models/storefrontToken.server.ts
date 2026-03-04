import { prisma } from '../db.server';

export async function getStorefrontTokenByShop(shop: string) {
    const tokens = await prisma.storefrontToken.findMany({
        where: {
            shop,
            isActive: true,
            isPaid: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return tokens;
}

// create a new storefront token record in db
export async function createStorefrontToken(data: {
    shop: string;
    tokenName: string;
    delegateAccessTokenId: string;
    delegateAccessToken: string;
    accessToken: string;
    createdBy?: string;
    expiresAt?: Date | null;
    isPaid?: boolean;
    chargeId?: string;
}) {
    return await prisma.storefrontToken.create({
        data: {
            shop: data.shop,
            tokenName: data.tokenName,
            delegateAccessTokenId: data.delegateAccessTokenId,
            delegateAccessToken: data.delegateAccessToken,
            accessToken: data.accessToken,
            scopes: 'unauthenticated_read_product_listings',
            createdBy: data.createdBy,
            expiresAt: data.expiresAt,        
            isPaid: data.isPaid ?? false,     
            chargeId: data.chargeId,   
        }
    });
}

// permanently delete a storefront token
export async function deleteStorefrontToken(id: number) {
    return await prisma.storefrontToken.delete({
        where: { id }
    });
}

// soft delete - mark storefront token as inactive
export async function revokeStorefrontToken(id: number) {
    return await prisma.storefrontToken.update({
        where: { id },
        data: {
            isActive: false,
            lastUsed: new Date()
        }
    });
}

export async function markStorefrontTokenAsPaid(chargeId: string) {
    return await prisma.storefrontToken.update({
        where: { chargeId },
        data: { isPaid: true, isActive: true }
    });
}