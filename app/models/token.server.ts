import { prisma } from '../db.server';

// Get all active tokens for a specific shop

export async function getTokensByShop(shop: string) {
  // Query database for tokens belonging to this shop
  const tokens = await prisma.generatedToken.findMany({
    where: { 
      shop,           // Match this shop
      isActive: true , // Only active tokens
      isPaid: true
    },
    orderBy: {
      createdAt: 'desc'  // Newest first
    }
  });
  
  // Convert scopes from JSON string back to array
  return tokens.map(token => ({
    ...token,  // Copy all fields
    scopes: JSON.parse(token.scopes) as string[],  // Parse JSON
  }));
}

// Create a new token record in database

export async function createToken(data: {
  shop: string;
  tokenName: string;
  delegateAccessTokenId: string;
  delegateAccessToken: string;
  accessToken: string;
  scopes: string[];
  expiresAt?: Date | null;
  createdBy?: string;
  isPaid?: boolean;             
  chargeId?: string;
}) {
  return await prisma.generatedToken.create({
    data: {
      shop: data.shop,
      tokenName: data.tokenName,
      delegateAccessTokenId: data.delegateAccessTokenId,
      delegateAccessToken: data.delegateAccessToken,
      accessToken: data.accessToken,
      scopes: JSON.stringify(data.scopes), // Convert array to JSON string
      expiresAt: data.expiresAt,
      createdBy: data.createdBy,
      isPaid: data.isPaid ?? false,
      chargeId: data.chargeId,
    }
  });
}

// Permanently delete a token

export async function deleteToken(id: number) {
  return await prisma.generatedToken.delete({
    where: { id }
  });
}

// Soft delete - mark token as inactive

export async function revokeToken(id: number) {
  return await prisma.generatedToken.update({
    where: { id },
    data: { 
      isActive: false,
      lastUsed: new Date()
    }
  });
}

export async function markTokenAsPaid(chargeId: string) {
  return await prisma.generatedToken.update({
    where: { chargeId },
    data: { isPaid: true, isActive: true }
  });
}