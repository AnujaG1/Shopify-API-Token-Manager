import { prisma } from './app/db.server';

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test: Create a token (matching YOUR current schema)
    const testToken = await prisma.generatedToken.create({
      data: {
        shop: 'test-store.myshopify.com',
        tokenName: 'Test Token',
        delegateAccessTokenId: 'test-id-123',
        delegateAccessToken: 'test-token-xyz',
        accessToken: 'test-access-token-abc',  // Added this field
        scopes: JSON.stringify(['READ_PRODUCTS', 'WRITE_PRODUCTS']),
      }
    });
    
    console.log('Created test token:', testToken);
    
    // Test: Retrieve tokens
    const tokens = await prisma.generatedToken.findMany({
      where: { shop: 'test-store.myshopify.com' }
    });
    
    console.log('Retrieved tokens:', tokens.length);
    
    // Test: Delete test token
    await prisma.generatedToken.delete({
      where: { id: testToken.id }
    });
    
    console.log('Deleted test token');
    console.log('Database test successful!');
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
