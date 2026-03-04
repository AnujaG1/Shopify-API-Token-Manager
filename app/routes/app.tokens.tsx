import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data, redirect } from 'react-router';
import { useLoaderData, useActionData, Form } from 'react-router';
import { prisma } from '../db.server';

import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Modal,
  FormLayout,
  TextField,
  ChoiceList,
  Banner,
  Text,
  Tabs,
} from '@shopify/polaris';

import { useState, useCallback, useEffect } from 'react';

import { authenticate } from '../shopify.server';

import { 
  getTokensByShop, 
  createToken, 
  deleteToken 
} from '../models/token.server';

import {
  getStorefrontTokenByShop,
  createStorefrontToken,
  deleteStorefrontToken,
} from '../models/storefrontToken.server';

// AVAILABLE SCOPES (Shopify permissions)
const AVAILABLE_SCOPES = [
  { label: 'Read Products', value: 'read_products' },
  { label: 'Write Products', value: 'write_products' },
  { label: 'Read Orders', value: 'read_orders' },
  { label: 'Write Orders', value: 'write_orders' },
  { label: 'Read Customers', value: 'read_customers' },
  { label: 'Write Customers', value: 'write_customers' },
  { label: 'Read Inventory', value: 'read_inventory' },
  { label: 'Write Inventory', value: 'write_inventory' },
  { label: 'Write Fulfillments', value: 'write_fulfillments' },
  { label: 'Write Draft Orders', value: 'write_draft_orders' },
];

type ActionData =
  | { success: true; token: string; tokenId: string; tokenType: 'admin' | 'storefront' }
  | { success: true }
  | { error: string };

/**
 * Loader: Fetches data before the page renders
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get both tokens for this shop from database (only PAID tokens)
  const adminTokens = await getTokensByShop(session.shop);
  const storefrontTokens = await getStorefrontTokenByShop(session.shop);
  
  return data({ 
    adminTokens,
    storefrontTokens,
    shop: session.shop  
  });
}

/**
 * Action: Handles form submissions (create/delete tokens)
 */
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const intent = String(formData.get('intent'));
  
  // ========================================
  // CREATE ADMIN TOKEN
  // ========================================
  if (intent === 'create-admin') {
    try {
      const tokenName = String(formData.get('tokenName'));
      const scopesJson = String(formData.get('scopes'));
      const scopes = JSON.parse(scopesJson);
      const expiryDateStr = formData.get('expiryDate');
      const expiryDate = expiryDateStr ? new Date(String(expiryDateStr)) : null;
      
      // Validate input
      if (!tokenName || tokenName.length < 3) {
        return data({ 
          error: 'Token name must be at least 3 characters' 
        }, { status: 400 });
      }
      
      if (!scopes || scopes.length === 0) {
        return data({ 
          error: 'Please select at least one permission' 
        }, { status: 400 });
      }
      
      // ========================================
      // PAYMENT FLOW - COMMENTED OUT FOR TESTING
      // ========================================
      // Uncomment this section when app is public and billing is enabled
      
      /*
      console.log('Creating Shopify charge for $5...');
      const chargeResponse = await admin.graphql(
        `#graphql
          mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!) {
            appPurchaseOneTimeCreate(
              name: $name
              price: $price
              returnUrl: $returnUrl
            ) {
              appPurchaseOneTime {
                id
                name
                price {
                  amount
                  currencyCode
                }
                status
                createdAt
                test
              }
              confirmationUrl
              userErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            name: `API Token: ${tokenName}`,
            price: { amount: 5.00, currencyCode: "USD" },
            returnUrl: `https://${session.shop}/admin/apps/api-token-manager-1/app/tokens/callback`
          }
        }
      );
      
      const chargeResult = await chargeResponse.json();
      const { appPurchaseOneTime, confirmationUrl, userErrors: chargeErrors } = chargeResult.data.appPurchaseOneTimeCreate;
      
      if (chargeErrors && chargeErrors.length > 0) {
        console.error('Charge creation failed:', chargeErrors);
        return data({ error: chargeErrors[0].message }, { status: 400 });
      }
      
      const chargeId = appPurchaseOneTime.id;
      
      console.log('Charge created successfully');
      console.log('Charge ID:', chargeId);
      console.log('Payment URL:', confirmationUrl);
      */
      
      // ========================================
      // CREATE TOKEN (WITHOUT PAYMENT FOR TESTING)
      // ========================================
      console.log('Creating token (TESTING MODE - no payment)...');
      
      const response = await admin.graphql(
        `#graphql
          mutation delegateAccessTokenCreate($input: DelegateAccessTokenInput!) {
            delegateAccessTokenCreate(input: $input) {
              delegateAccessToken {
                accessToken
                accessScopes
              }
              userErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            input: {
              delegateAccessScope: scopes,
            }
          }
        }
      );
      
      const result = await response.json();
      const { delegateAccessToken, userErrors } = result.data.delegateAccessTokenCreate;
      
      if (userErrors && userErrors.length > 0) {
        return data({ error: userErrors[0].message }, { status: 400 });
      }
      
      const uniqueTokenId = `admin_${session.shop}_${Date.now()}`;
      
      // ========================================
      // SAVE TOKEN TO DATABASE
      // ========================================
      
      // WITH PAYMENT (commented out):
      /*
      const savedToken = await createToken({
        shop: session.shop,
        tokenName: tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: delegateAccessToken.accessToken,
        accessToken: session.accessToken ?? '',
        scopes: scopes,
        createdBy: session.shop,
        expiresAt: expiryDate,
        isPaid: false,  // Token hidden until payment
        chargeId: chargeId
      });
      
      // Save payment record
      await prisma.paymentCharge.create({
        data: {
          chargeId: chargeId,
          tokenId: savedToken.id,
          tokenType: 'admin',
          shop: session.shop,
          amount: '5.00',
          status: 'pending',
          confirmationUrl: confirmationUrl
        }
      });
      
      console.log('Token saved with ID:', savedToken.id);
      console.log('Redirecting user to payment page...');
      
      // Redirect to Shopify payment page
      return redirect(confirmationUrl);
      */
      
      // WITHOUT PAYMENT (for testing):
      const savedToken = await createToken({
        shop: session.shop,
        tokenName: tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: delegateAccessToken.accessToken,
        accessToken: session.accessToken ?? '',
        scopes: scopes,
        createdBy: session.shop,
        expiresAt: expiryDate,
        isPaid: true,  // TESTING: Mark as paid immediately
        chargeId: null
      });
      
      console.log('✅ Token created successfully (no payment required)');
      
      return data({ 
        success: true,
        token: delegateAccessToken.accessToken,
        tokenId: uniqueTokenId,
        tokenType: 'admin'
      });
      
    } catch (error) {
      console.error('Error creating admin token:', error);
      return data({ error: 'Failed to create admin token' }, { status: 500 });
    }
  }

  // ========================================
  // CREATE STOREFRONT TOKEN
  // ========================================
  if (intent === 'create-storefront') {
    try {
      const tokenName = String(formData.get('tokenName'));
      const expiryDateStr = formData.get('expiryDate');
      const expiryDate = expiryDateStr ? new Date(String(expiryDateStr)) : null;
      
      if (!tokenName || tokenName.length < 3) {
        return data({ 
          error: 'Token name must be at least 3 characters' 
        }, { status: 400 });
      }
      
      // ========================================
      // PAYMENT FLOW - COMMENTED OUT FOR TESTING
      // ========================================
      
      /*
      console.log('Creating Shopify charge for storefront token...');
      const chargeResponse = await admin.graphql(
        `#graphql
          mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!) {
            appPurchaseOneTimeCreate(
              name: $name
              price: $price
              returnUrl: $returnUrl
            ) {
              appPurchaseOneTime {
                id
                name
                price {
                  amount
                  currencyCode
                }
                status
                createdAt
                test
              }
              confirmationUrl
              userErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            name: `Storefront API Token: ${tokenName}`,
            price: { amount: 5.00, currencyCode: "USD" },
            returnUrl: `https://${session.shop}/admin/apps/api-token-manager-1/app/tokens/callback`
          }
        }
      );
      
      const chargeResult = await chargeResponse.json();
      const { appPurchaseOneTime, confirmationUrl, userErrors: chargeErrors } = chargeResult.data.appPurchaseOneTimeCreate;
      
      if (chargeErrors && chargeErrors.length > 0) {
        return data({ error: chargeErrors[0].message }, { status: 400 });
      }
      
      const chargeId = appPurchaseOneTime.id;
      */
      
      // ========================================
      // CREATE TOKEN (WITHOUT PAYMENT FOR TESTING)
      // ========================================
      console.log('Creating storefront token (TESTING MODE - no payment)...');
      
      const response = await admin.graphql(
        `#graphql
          mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
            storefrontAccessTokenCreate(input: $input) {
              storefrontAccessToken {
                accessToken
                title
              }
              userErrors {
                field
                message
              }
            }
          }`,
        {
          variables: {
            input: {
              title: tokenName,
            }
          }
        }
      );
      
      const result = await response.json();
      const { storefrontAccessToken, userErrors } = result.data.storefrontAccessTokenCreate;
      
      if (userErrors && userErrors.length > 0) {
        return data({ error: userErrors[0].message }, { status: 400 });
      }
      
      const uniqueTokenId = `storefront_${session.shop}_${Date.now()}`;
      
      // WITH PAYMENT (commented out):
      /*
      const savedToken = await createStorefrontToken({
        shop: session.shop,
        tokenName: tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: storefrontAccessToken.accessToken,
        accessToken: session.accessToken ?? '',
        createdBy: session.shop,
        expiresAt: expiryDate,
        isPaid: false,
        chargeId: chargeId
      });
      
      await prisma.paymentCharge.create({
        data: {
          chargeId: chargeId,
          tokenId: savedToken.id,
          tokenType: 'storefront',
          shop: session.shop,
          amount: '5.00',
          status: 'pending',
          confirmationUrl: confirmationUrl
        }
      });
      
      return redirect(confirmationUrl);
      */
      
      // WITHOUT PAYMENT (for testing):
      await createStorefrontToken({
        shop: session.shop,
        tokenName: tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: storefrontAccessToken.accessToken,
        accessToken: session.accessToken ?? '',
        createdBy: session.shop,
        expiresAt: expiryDate,
        isPaid: true,  // TESTING: Mark as paid
        chargeId: null
      });
      
      console.log('✅ Storefront token created successfully (no payment required)');
      
      return data({ 
        success: true,
        token: storefrontAccessToken.accessToken,
        tokenId: uniqueTokenId,
        tokenType: 'storefront'
      });
      
    } catch (error) {
      console.error('Error creating storefront token:', error);
      return data({ error: 'Failed to create storefront token' }, { status: 500 });
    }
  }

  // ========================================
  // DELETE ADMIN TOKEN
  // ========================================
  if (intent === 'delete-admin') {
    try {
      const tokenId = parseInt(String(formData.get('tokenId')));
      await deleteToken(tokenId);
      return data({ success: true });
    } catch (error) {
      console.error('Error deleting token:', error);
      return data({ error: 'Failed to delete token' }, { status: 500 });
    }
  }

  // ========================================
  // DELETE STOREFRONT TOKEN
  // ========================================
  if (intent === 'delete-storefront') {
    try {
      const tokenId = parseInt(String(formData.get('tokenId')));
      await deleteStorefrontToken(tokenId);
      return data({ success: true });
    } catch (error) {
      console.error('Error deleting storefront token:', error);
      return data({ error: 'Failed to delete token' }, { status: 500 });
    }
  }
  
  return data({ error: 'Invalid action' }, { status: 400 });
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function TokensPage() {
  const { adminTokens, storefrontTokens } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  
  // Local state
  const [selectedTab, setSelectedTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [newTokenType, setNewTokenType] = useState<'admin' | 'storefront'>('admin');
  const [tokenName, setTokenName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  
  // Handle create token
  const handleCreate = useCallback(() => {
    const formId = selectedTab === 0 ? 'create-admin-form' : 'create-storefront-form';
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
    setShowCreateModal(false);
  }, [selectedTab]);
  
  // Handle delete token
  const handleDelete = useCallback((tokenId: number, type: 'admin' | 'storefront') => {
    if (confirm('Are you sure you want to delete this token?')) {
      const form = document.getElementById(`delete-form-${type}-${tokenId}`) as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }
  }, []);
  
  // Show new token modal when token is created
  useEffect(() => {
    if (actionData && "token" in actionData) {
      setNewToken(actionData.token);
      setNewTokenType(actionData.tokenType);
      setShowTokenModal(true);
      setTokenName('');
      setSelectedScopes([]);
      setExpiryDate('');
    }
  }, [actionData]);

  // Tabs configuration
  const tabs = [
    {
      id: 'admin-tokens',
      content: `Admin API (${adminTokens.length})`,
    },
    {
      id: 'storefront-tokens',
      content: `Storefront API (${storefrontTokens.length})`,
    },
  ];
  
  // Admin tokens table data
  const adminRows = adminTokens.map(token => [
    token.tokenName,
    token.scopes.join(', '),
    new Date(token.createdAt).toLocaleDateString(),
    token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never',
    token.isActive ? 'Active' : 'Revoked',
    <Form key={token.id} id={`delete-form-admin-${token.id}`} method="post" style={{ display: 'inline' }}>
      <input type="hidden" name="intent" value="delete-admin" />
      <input type="hidden" name="tokenId" value={token.id} />
      <Button 
        tone="critical" 
        onClick={() => handleDelete(token.id, 'admin')}
        submit
      >
        Delete
      </Button>
    </Form>
  ]);

  // Storefront tokens table data
  const storefrontRows = storefrontTokens.map(token => [
    token.tokenName,
    new Date(token.createdAt).toLocaleDateString(),
    token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never',
    token.isActive ? 'Active' : 'Revoked',
    <Form key={token.id} id={`delete-form-storefront-${token.id}`} method="post" style={{ display: 'inline' }}>
      <input type="hidden" name="intent" value="delete-storefront" />
      <input type="hidden" name="tokenId" value={token.id} />
      <Button
        tone="critical"
        onClick={() => handleDelete(token.id, 'storefront')}
        submit
      >
        Delete
      </Button>
    </Form>
  ]);
  
  return (
    <Page
      title="API Token Manager"
      primaryAction={{
        content: 'Create Token',
        onAction: () => setShowCreateModal(true)
      }}
    >
      <Layout>
        <Layout.Section>
          {/* TESTING MODE BANNER */}
          <div style={{ marginBottom: '1rem' }}>
            <Banner tone="info">
              <p>🧪 <strong>Testing Mode:</strong> Payment is currently disabled. Tokens are created for free.</p>
            </Banner>
          </div>
          
          {/* Success banner - PAYMENT FLOW (commented) */}
          {/* 
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === 'true' && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner 
                tone="success" 
                onDismiss={() => {
                  window.history.replaceState({}, '', '/app/tokens');
                  window.location.reload();
                }}
              >
                <p>✅ Payment approved! Your token has been created successfully.</p>
              </Banner>
            </div>
          )}
          */}
          
          {/* Payment declined banner - PAYMENT FLOW (commented) */}
          {/*
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') === 'payment_declined' && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner 
                tone="critical" 
                onDismiss={() => {
                  window.history.replaceState({}, '', '/app/tokens');
                }}
              >
                <p>❌ Payment was declined. Please try again.</p>
              </Banner>
            </div>
          )}
          */}
          
          {/* Show errors from action */}
          {actionData && "error" in actionData && (
            <div style={{ marginBottom: '1rem' }}>
              <Banner tone="critical">
                <p>{actionData.error}</p>
              </Banner>
            </div>
          )}
          
          {/* Tokens table */}
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              {/* TAB 1: Admin API Tokens */}
              {selectedTab === 0 && (
                <div style={{ padding: '16px' }}>
                  <Text as="h2" variant="headingMd">Admin API Tokens</Text>
                  <Text as="p" variant="bodyMd">
                    Admin API tokens allow backend applications to manage your store.
                  </Text>
                  <div style={{ marginTop: '1rem' }}>
                    {adminTokens.length === 0 ? (
                      <Text as="p">No admin tokens yet. Create your first one!</Text>
                    ) : (
                      <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                        headings={['Name', 'Scopes', 'Created', 'Expires', 'Status', 'Actions']}
                        rows={adminRows}
                      />
                    )}
                  </div>
                </div>
              )}
              
              {/* TAB 2: Storefront API Tokens */}
              {selectedTab === 1 && (
                <div style={{ padding: '16px' }}>
                  <Text as="h2" variant="headingMd">Storefront API Tokens</Text>
                  <Text as="p" variant="bodyMd">
                    Storefront API tokens allow headless storefronts and mobile apps to access public store data.
                  </Text>
                  <div style={{ marginTop: '1rem' }}>
                    {storefrontTokens.length === 0 ? (
                      <Text as="p">No storefront tokens yet. Create your first one!</Text>
                    ) : (
                      <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                        headings={['Name', 'Created', 'Expires', 'Status', 'Actions']}
                        rows={storefrontRows}
                      />
                    )}
                  </div>
                </div>
              )}
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
      
      {/* Create Token Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setTokenName('');
          setSelectedScopes([]);
          setExpiryDate('');
        }}
        title={selectedTab === 0 ? 'Create Admin API Token' : 'Create Storefront API Token'}
        primaryAction={{
          content: 'Create Token', // Change from "Create & Pay $5" when payment is enabled
          onAction: handleCreate,
          disabled: !tokenName || (selectedTab === 0 && selectedScopes.length === 0)
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => {
            setShowCreateModal(false);
            setTokenName('');
            setSelectedScopes([]);
            setExpiryDate('');
          },
        }]}
      >
        <Modal.Section>
          {/* Admin Token Form */}
          {selectedTab === 0 && (
            <Form id="create-admin-form" method="post">
              <input type="hidden" name="intent" value="create-admin" />
              <input type="hidden" name="tokenName" value={tokenName} />
              <input type="hidden" name="scopes" value={JSON.stringify(selectedScopes)} />
              <input type="hidden" name="expiryDate" value={expiryDate} />
              
              <FormLayout>
                <TextField
                  label="Token Name"
                  value={tokenName}
                  onChange={setTokenName}
                  placeholder="e.g., Inventory Management System"
                  autoComplete="off"
                />
                
                <TextField
                  label="Expiry Date (Optional)"
                  type="date"
                  value={expiryDate}
                  onChange={setExpiryDate}
                  helpText="Leave blank if token should never expire"
                  autoComplete="off"
                />
                
                <ChoiceList
                  title="Permissions (Scopes)"
                  choices={AVAILABLE_SCOPES}
                  selected={selectedScopes}
                  onChange={setSelectedScopes}
                  allowMultiple
                />
                
                {/* PAYMENT BANNER - Uncomment when payment is enabled */}
                {/*
                <Banner tone="info">
                  <p>💳 You will be charged <strong>$5.00 USD</strong> after clicking "Create & Pay $5".</p>
                </Banner>
                */}
              </FormLayout>
            </Form>
          )}
          
          {/* Storefront Token Form */}
          {selectedTab === 1 && (
            <Form id="create-storefront-form" method="post">
              <input type="hidden" name="intent" value="create-storefront" />
              <input type="hidden" name="tokenName" value={tokenName} />
              <input type="hidden" name="expiryDate" value={expiryDate} />
              
              <FormLayout>
                <TextField
                  label="Token Name"
                  value={tokenName}
                  onChange={setTokenName}
                  placeholder="e.g., Mobile App v2"
                  autoComplete="off"
                />
                
                <TextField
                  label="Expiry Date (Optional)"
                  type="date"
                  value={expiryDate}
                  onChange={setExpiryDate}
                  helpText="Leave blank if token should never expire"
                  autoComplete="off"
                />
                
                <Banner>
                  <p>Storefront tokens have predefined public access scopes for reading products, collections, and creating checkouts.</p>
                </Banner>
                
                {/* PAYMENT BANNER - Uncomment when payment is enabled */}
                {/*
                <Banner tone="info">
                  <p>💳 You will be charged <strong>$5.00 USD</strong> after clicking "Create & Pay $5".</p>
                </Banner>
                */}
              </FormLayout>
            </Form>
          )}
        </Modal.Section>
      </Modal>
      
      {/* Show Token Once Modal */}
      <Modal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title="💾 Save Your Token"
      >
        <Modal.Section>
          <Banner tone="warning">
            <p><strong>Copy this token now!</strong> For security reasons, it won't be shown again.</p>
          </Banner>

          <div style={{ marginTop: '1rem' }}>
            <Text as="p" variant="bodyMd">
              <strong>Type:</strong> {newTokenType === 'admin' ? 'Admin API' : 'Storefront API'}
            </Text>
          </div>  
          
          <div style={{ marginTop: '1rem' }}>
            <TextField
              label="Access Token"
              value={newToken}
              readOnly
              autoComplete="off"
              connectedRight={
                <Button onClick={() => {
                  navigator.clipboard.writeText(newToken);
                  alert('Copied to clipboard!');
                }}>
                  Copy
                </Button>
              }
            />
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}