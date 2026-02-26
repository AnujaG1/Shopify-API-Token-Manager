import { prisma } from '../db.server';

export async function getStorefrontTokenByShop(shop: string) {
    const tokens = await prisma.storefrontToken.findMany({
        where: {
            shop,
            isActive: true
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