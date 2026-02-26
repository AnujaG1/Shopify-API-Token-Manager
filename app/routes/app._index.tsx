import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';    // wraps response and status properly
import { useLoaderData, useActionData, Form } from 'react-router';

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
}  from '../models/storefrontToken.server';

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
];

type ActionData =
  | { success: true; token: string; tokenId: string; tokenType: 'admin' | 'storefront' }
  | { success: true }
  | { error: string };

/**
 * Loader: Fetches data before the page renders
 * Runs on: Server-side
 * Triggers: When user navigates to /app/tokens
 * Returns: Data to be used by the component
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get both tokens for this shop from database
  const adminTokens = await getTokensByShop(session.shop);
  const storefrontTokens = await getStorefrontTokenByShop(session.shop);

  
  // This data will be available via useLoaderData() in the component
  return data({ 
    adminTokens,
    storefrontTokens,
    shop: session.shop  
  });
}
/**
 * Action: Handles form submissions (create/delete tokens)
 * Runs on: Server-side
 * Triggers: When user submits a form
 * Returns: Result of the action
 */
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  // Parse form data
  const formData = await request.formData();
  const intent = String(formData.get('intent')); // "create" or "delete"
  
  if (intent === 'create-admin') {
    try {
      // Extract form fields
      const tokenName = String(formData.get('tokenName'));
      const scopesJson = String(formData.get('scopes'));
      const scopes = JSON.parse(scopesJson); // Parse JSON array
      
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
      
      // Call Shopify GraphQL API to create delegate access token
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
      
      // Parse GraphQL response
      const result = await response.json();
      const { delegateAccessToken, userErrors } = 
        result.data.delegateAccessTokenCreate;
      
      // Check for errors from Shopify
      if (userErrors && userErrors.length > 0) {
        return data({ 
          error: userErrors[0].message 
        }, { status: 400 });
      }
      
      // Generate a unique ID for this token
      const uniqueTokenId = `${session.shop}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Save token metadata to database
      await createToken({
        shop: session.shop,
        tokenName: tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: delegateAccessToken.accessToken,
        accessToken: session.accessToken ?? '',
        scopes: scopes,
        createdBy: session.shop,
      });
      
      // Return success with token
  
      return data({ 
        success: true,
        token: delegateAccessToken.accessToken,
        tokenId: uniqueTokenId,
        tokenType: 'admin'
      });
      
    } catch (error) {
      console.error('Error creating token:', error);
      return data({ 
        error: 'Failed to create token. Please try again.' 
      }, { status: 500 });
    }
  }

  // create storefront token

 if (intent === 'create-storefront') {
    try {
      const tokenName = String(formData.get('tokenName'));
      
      if (!tokenName || tokenName.length < 3) {
        return data({ 
          error: 'Token name must be at least 3 characters' 
        }, { status: 400 });
      }
      
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
      const { storefrontAccessToken, userErrors } = 
        result.data.storefrontAccessTokenCreate;
      
      if (userErrors && userErrors.length > 0) {
        return data({ 
          error: userErrors[0].message 
        }, { status: 400 });
      }
      
      const uniqueTokenId = `storefront_${session.shop}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await createStorefrontToken({
        shop: session.shop,
        tokenName: tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: storefrontAccessToken.accessToken,
        accessToken: session.accessToken ?? '',
        createdBy: session.shop,
      });
      
      return data({ 
        success: true,
        token: storefrontAccessToken.accessToken,
        tokenId: uniqueTokenId,
        tokenType: 'storefront'
      });
      
    } catch (error) {
      console.error('Error creating storefront token:', error);
      return data({ 
        error: 'Failed to create storefront token. Please try again.' 
      }, { status: 500 });
    }
  }

  // delete admin here

  if (intent === 'delete-admin') {
    try {
      // Get token ID from form
      const tokenId = parseInt(String(formData.get('tokenId')));
      
      // Delete from database
      await deleteToken(tokenId);
      
      // Return success
      return data({ success: true });
      
    } catch (error) {
      console.error('Error deleting token:', error);
      return data({ 
        error: 'Failed to delete token. Please try again.' 
      }, { status: 500 });
    }
  }

  // delete storefront token

  if (intent === 'delete-storefront') {
    try {
      const tokenId = parseInt(String(formData.get('tokenId')));
      await deleteStorefrontToken(tokenId);
      return data({ success: true });
    } catch (error) {
      console.error('Error deleting storefront token: ', error);
      return data({
        error: 'Failed to delete token. Please try again.'
      }, { status: 500 });
    }
  }
  
  // Invalid intent
  return data({ 
    error: 'Invalid action' 
  }, { status: 400 });
}

// Main component for the Tokens page

export default function TokensPage() {
  // Get both types of tokens from loader
  const { adminTokens, storefrontTokens } = useLoaderData<typeof loader>();
  
 // ADD THESE DEBUG LINES
  console.log('Admin Tokens:', adminTokens);
  console.log('Storefront Tokens:', storefrontTokens);
  console.log('Storefront Tokens type:', typeof storefrontTokens);
  console.log('Storefront Tokens is array:', Array.isArray(storefrontTokens));

  // Get action result (if form was submitted)
  const actionData = useActionData<ActionData>();
  
  // Local state
  const [selectedTab, setSelectedTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [newTokenType, setNewTokenType] = useState<'admin' | 'storefront'>('admin');
  const [tokenName, setTokenName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  
  // Handle create token
  const handleCreate = useCallback(() => {
    const formId = 
    selectedTab === 0 
    ? 'create-admin-form' 
    : 'create-storefront-form';

    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
    setShowCreateModal(false);
  }, [selectedTab]);
  
  // Handle delete token
  const handleDelete = useCallback((tokenId: number, type: 'admin' | 'storefront') => {
    if (confirm('Are you sure you want to delete this token?')) {
      const form = document.getElementById(`delete-form-${tokenId}`) as HTMLFormElement;
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
    }
  }, [actionData]);

  // tabs configuration
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
    token.isActive ? 'Active' : 'Revoked',
    <Form key={token.id} id={`delete-form-${token.id}`} method="post" style={{ display: 'inline' }}>
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
    token.isActive ? 'Active' : 'Revoked',
    <Form key={token.id} id={`delete-form-storefront-${token.id}`} method="post" style={{ display: 'inline' }}>
      <input type="hidden" name="intent" value="delete-storefront" />
      <input type="hidden" name="tokenId" value={token.id} />
      <Button
      tone="critical"
      onClick={() => handleDelete(token.id, 'storefront')}
      submit>
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
          {/* Show errors */}
          {actionData && "error" in actionData && (
            <Banner tone="critical">
              <p>{actionData.error}</p>
            </Banner>
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
                        columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                        headings={['Name', 'Scopes', 'Created', 'Status', 'Actions']}
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
                        columnContentTypes={['text', 'text', 'text', 'text']}
                        headings={['Name', 'Created', 'Status', 'Actions']}
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
        }
      }
      title={selectedTab === 0 ? 'Create Admin API Token' : 'Create Storefront API Token'}
        primaryAction={{
          content: 'Create',
          onAction: handleCreate,
          disabled: !tokenName || (selectedTab === 0 && selectedScopes.length === 0)
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => {
            setShowCreateModal(false);
            setTokenName('');
            setSelectedScopes([]);
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
              
              <FormLayout>
                <TextField
                  label="Token Name"
                  value={tokenName}
                  onChange={setTokenName}
                  placeholder="e.g., Inventory Management System"
                  autoComplete="off"
                />
                
                <ChoiceList
                  title="Permissions (Scopes)"
                  choices={AVAILABLE_SCOPES}
                  selected={selectedScopes}
                  onChange={setSelectedScopes}
                  allowMultiple
                />
              </FormLayout>
            </Form>
          )}
          
          {/* Storefront Token Form */}
          {selectedTab === 1 && (
            <Form id="create-storefront-form" method="post">
              <input type="hidden" name="intent" value="create-storefront" />
              <input type="hidden" name="tokenName" value={tokenName} />
              
              <FormLayout>
                <TextField
                  label="Token Name"
                  value={tokenName}
                  onChange={setTokenName}
                  placeholder="e.g., Mobile App v2"
                  autoComplete="off"
                />
                
                <Banner>
                  <p>Storefront tokens have predefined public access scopes for reading products, collections, and creating checkouts.</p>
                </Banner>
              </FormLayout>
            </Form>
          )}
        </Modal.Section>
      </Modal>
      
      {/* Show Token Once Modal */}
      <Modal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title=" Save Your Token"
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