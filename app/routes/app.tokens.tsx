// import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
// import { data, redirect } from 'react-router';
// import { useLoaderData, useActionData, Form } from 'react-router';
// import { prisma } from '../db.server';

// import {
//   Page,
//   Layout,
//   Card,
//   DataTable,
//   Button,
//   Modal,
//   FormLayout,
//   TextField,
//   ChoiceList,
//   Banner,
//   Text,
//   Tabs,
// } from '@shopify/polaris';

// import { useState, useCallback, useEffect } from 'react';
// import { authenticate } from '../shopify.server';
// import { 
//   getTokensByShop, 
//   createToken, 
//   deleteToken 
// } from '../models/token.server';

// import {
//   getStorefrontTokenByShop,
//   createStorefrontToken,
//   deleteStorefrontToken,
// } from '../models/storefrontToken.server';

// const AVAILABLE_SCOPES = [
//   { label: 'Read Products',      value: 'read_products' },
//   { label: 'Write Products',     value: 'write_products' },
//   { label: 'Read Orders',        value: 'read_orders' },
//   { label: 'Write Orders',       value: 'write_orders' },
//   { label: 'Read Customers',     value: 'read_customers' },
//   { label: 'Write Customers',    value: 'write_customers' },
//   { label: 'Read Inventory',     value: 'read_inventory' },
//   { label: 'Write Inventory',    value: 'write_inventory' },
//   { label: 'Write Fulfillments', value: 'write_fulfillments' },
//   { label: 'Write Draft Orders', value: 'write_draft_orders' },
// ];

// type ActionData =
//   | { success: true; token: string; tokenId: string; tokenType: 'admin' | 'storefront' }
//   | { success: true }
//   | { error: string };

// // ── LOADER ────────────────────────────────────────────────────────────────────
// // Handles both normal page load AND billing callback from Shopify
// export async function loader({ request }: LoaderFunctionArgs) {
//   const { admin, session } = await authenticate.admin(request);

//   // Shopify redirects back here with ?charge_id=xxx after billing approval
//   const url       = new URL(request.url);
//   const chargeId  = url.searchParams.get('charge_id');
//   const tokenDbId = url.searchParams.get('token_db_id');
//   const tokenType = url.searchParams.get('token_type') as 'admin' | 'storefront' | null;

//   if (chargeId && tokenDbId && tokenType) {
//     try {
//       // Verify the charge status with Shopify
//       const verifyRes  = await admin.graphql(
//         `#graphql
//           query getAppPurchase($id: ID!) {
//             node(id: $id) {
//               ... on AppPurchaseOneTime { id status }
//             }
//           }`,
//         { variables: { id: `gid://shopify/AppPurchaseOneTime/${chargeId}` } }
//       );
//       const verifyJson = await verifyRes.json();
//       const status: string = verifyJson?.data?.node?.status ?? 'PENDING';

//       if (status === 'ACTIVE') {
//         // Payment confirmed — activate the token
//         if (tokenType === 'admin') {
//           await prisma.generatedToken.update({
//             where: { id: parseInt(tokenDbId) },
//             data:  { isPaid: true, isActive: true, chargeId },
//           });
//         } else {
//           await prisma.storefrontToken.update({
//             where: { id: parseInt(tokenDbId) },
//             data:  { isPaid: true, isActive: true, chargeId },
//           });
//         }
//         await prisma.paymentCharge.updateMany({
//           where: { chargeId },
//           data:  { status: 'paid', approvedAt: new Date() },
//         });
//       }
//     } catch (e) {
//       console.error('Error verifying charge:', e);
//     }
//     return redirect('/app/tokens');
//   }

//   // Normal load — only show paid tokens
//   const adminTokens      = await getTokensByShop(session.shop);
//   const storefrontTokens = await getStorefrontTokenByShop(session.shop);

//   return data({ adminTokens, storefrontTokens, shop: session.shop });
// }

// // ── ACTION ────────────────────────────────────────────────────────────────────
// export async function action({ request }: ActionFunctionArgs) {
//   const { admin, session } = await authenticate.admin(request);
  
//   const formData = await request.formData();
//   const intent   = String(formData.get('intent'));
  
//   // ── CREATE ADMIN TOKEN ────────────────────────────────────────────────────
//   if (intent === 'create-admin') {
//     try {
//       const tokenName     = String(formData.get('tokenName'));
//       const scopesJson    = String(formData.get('scopes'));
//       const scopes        = JSON.parse(scopesJson);
//       const expiryDateStr = formData.get('expiryDate');
//       const expiryDate    = expiryDateStr ? new Date(String(expiryDateStr)) : null;
      
//       if (!tokenName || tokenName.length < 3)
//         return data({ error: 'Token name must be at least 3 characters' }, { status: 400 });
//       if (!scopes || scopes.length === 0)
//         return data({ error: 'Please select at least one permission' }, { status: 400 });
      
//       // Step 1: Create delegate access token
//       const response = await admin.graphql(
//         `#graphql
//           mutation delegateAccessTokenCreate($input: DelegateAccessTokenInput!) {
//             delegateAccessTokenCreate(input: $input) {
//               delegateAccessToken { accessToken accessScopes }
//               userErrors { field message }
//             }
//           }`,
//         { variables: { input: { delegateAccessScope: scopes } } }
//       );
//       const result = await response.json();
//       const { delegateAccessToken, userErrors } = result.data.delegateAccessTokenCreate;
      
//       if (userErrors && userErrors.length > 0)
//         return data({ error: userErrors[0].message }, { status: 400 });
      
//       const uniqueTokenId = `admin_${session.shop}_${Date.now()}`;

//       // Step 2: Save token as UNPAID (hidden until payment confirmed)
//       const savedToken = await createToken({
//         shop:                  session.shop,
//         tokenName,
//         delegateAccessTokenId: uniqueTokenId,
//         delegateAccessToken:   delegateAccessToken.accessToken,
//         accessToken:           session.accessToken ?? '',
//         scopes,
//         createdBy:             session.shop,
//         expiresAt:             expiryDate,
//         isPaid:                false,
//         chargeId:              null,
//       });

//       // Step 3: Create one-time charge via Shopify billing API
//       const appUrl    = process.env.SHOPIFY_APP_URL || '';
//       const returnUrl = `${appUrl}/app/tokens?token_db_id=${savedToken.id}&token_type=admin`;

//       const chargeResponse = await admin.graphql(
//         `#graphql
//           mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
//             appPurchaseOneTimeCreate(name: $name, price: $price, returnUrl: $returnUrl, test: $test) {
//               appPurchaseOneTime { id status }
//               confirmationUrl
//               userErrors { field message }
//             }
//           }`,
//         {
//           variables: {
//             name:      `API Token: ${tokenName}`,
//             price:     { amount: '5.00', currencyCode: 'USD' },
//             returnUrl,
//             test:      true, // ← set to false in production
//           }
//         }
//       );
//       const chargeResult = await chargeResponse.json();
//       const { appPurchaseOneTime, confirmationUrl, userErrors: chargeErrors } =
//         chargeResult.data.appPurchaseOneTimeCreate;
      
//       if (chargeErrors && chargeErrors.length > 0) {
//         await deleteToken(savedToken.id); // clean up unpaid token
//         return data({ error: chargeErrors[0].message }, { status: 400 });
//       }

//       const numericChargeId = appPurchaseOneTime.id.split('/').pop() ?? appPurchaseOneTime.id;

//       // Step 4: Save payment record and link to token
//       await prisma.paymentCharge.create({
//         data: {
//           chargeId:        numericChargeId,
//           tokenId:         savedToken.id,
//           tokenType:       'admin',
//           shop:            session.shop,
//           amount:          '5.00',
//           status:          'pending',
//           confirmationUrl: confirmationUrl,
//         }
//       });
//       await prisma.generatedToken.update({
//         where: { id: savedToken.id },
//         data:  { chargeId: numericChargeId },
//       });

//       // Step 5: Redirect to Shopify billing page
//       return redirect(confirmationUrl);
      
//     } catch (error) {
//       console.error('Error creating admin token:', error);
//       return data({ error: 'Failed to create admin token' }, { status: 500 });
//     }
//   }

//   // ── CREATE STOREFRONT TOKEN ───────────────────────────────────────────────
//   if (intent === 'create-storefront') {
//     try {
//       const tokenName     = String(formData.get('tokenName'));
//       const expiryDateStr = formData.get('expiryDate');
//       const expiryDate    = expiryDateStr ? new Date(String(expiryDateStr)) : null;
      
//       if (!tokenName || tokenName.length < 3)
//         return data({ error: 'Token name must be at least 3 characters' }, { status: 400 });
      
//       const response = await admin.graphql(
//         `#graphql
//           mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
//             storefrontAccessTokenCreate(input: $input) {
//               storefrontAccessToken { accessToken title }
//               userErrors { field message }
//             }
//           }`,
//         { variables: { input: { title: tokenName } } }
//       );
//       const result = await response.json();
//       const { storefrontAccessToken, userErrors } = result.data.storefrontAccessTokenCreate;
      
//       if (userErrors && userErrors.length > 0)
//         return data({ error: userErrors[0].message }, { status: 400 });
      
//       const uniqueTokenId = `storefront_${session.shop}_${Date.now()}`;

//       const savedToken = await createStorefrontToken({
//         shop:                  session.shop,
//         tokenName,
//         delegateAccessTokenId: uniqueTokenId,
//         delegateAccessToken:   storefrontAccessToken.accessToken,
//         accessToken:           session.accessToken ?? '',
//         createdBy:             session.shop,
//         expiresAt:             expiryDate,
//         isPaid:                false,
//         chargeId:              null,
//       });

//       const appUrl    = process.env.SHOPIFY_APP_URL || '';
//       const returnUrl = `${appUrl}/app/tokens?token_db_id=${savedToken.id}&token_type=storefront`;

//       const chargeResponse = await admin.graphql(
//         `#graphql
//           mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
//             appPurchaseOneTimeCreate(name: $name, price: $price, returnUrl: $returnUrl, test: $test) {
//               appPurchaseOneTime { id status }
//               confirmationUrl
//               userErrors { field message }
//             }
//           }`,
//         {
//           variables: {
//             name:      `Storefront Token: ${tokenName}`,
//             price:     { amount: '5.00', currencyCode: 'USD' },
//             returnUrl,
//             test:      true, // ← set to false in production
//           }
//         }
//       );
//       const chargeResult = await chargeResponse.json();
//       const { appPurchaseOneTime, confirmationUrl, userErrors: chargeErrors } =
//         chargeResult.data.appPurchaseOneTimeCreate;
      
//       if (chargeErrors && chargeErrors.length > 0) {
//         await deleteStorefrontToken(savedToken.id);
//         return data({ error: chargeErrors[0].message }, { status: 400 });
//       }

//       const numericChargeId = appPurchaseOneTime.id.split('/').pop() ?? appPurchaseOneTime.id;

//       await prisma.paymentCharge.create({
//         data: {
//           chargeId:        numericChargeId,
//           tokenId:         savedToken.id,
//           tokenType:       'storefront',
//           shop:            session.shop,
//           amount:          '5.00',
//           status:          'pending',
//           confirmationUrl: confirmationUrl,
//         }
//       });
//       await prisma.storefrontToken.update({
//         where: { id: savedToken.id },
//         data:  { chargeId: numericChargeId },
//       });

//       return redirect(confirmationUrl);
      
//     } catch (error) {
//       console.error('Error creating storefront token:', error);
//       return data({ error: 'Failed to create storefront token' }, { status: 500 });
//     }
//   }

//   // ── DELETE ADMIN TOKEN ────────────────────────────────────────────────────
//   if (intent === 'delete-admin') {
//     try {
//       await deleteToken(parseInt(String(formData.get('tokenId'))));
//       return data({ success: true });
//     } catch (error) {
//       return data({ error: 'Failed to delete token' }, { status: 500 });
//     }
//   }

//   // ── DELETE STOREFRONT TOKEN ───────────────────────────────────────────────
//   if (intent === 'delete-storefront') {
//     try {
//       await deleteStorefrontToken(parseInt(String(formData.get('tokenId'))));
//       return data({ success: true });
//     } catch (error) {
//       return data({ error: 'Failed to delete token' }, { status: 500 });
//     }
//   }
  
//   return data({ error: 'Invalid action' }, { status: 400 });
// }

// // ── COMPONENT ─────────────────────────────────────────────────────────────────
// // Kept exactly the same as your original — only the modal button text changed
// export default function TokensPage() {
//   const { adminTokens, storefrontTokens } = useLoaderData<typeof loader>();
//   const actionData = useActionData<ActionData>();
  
//   const [selectedTab,     setSelectedTab]     = useState(0);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showTokenModal,  setShowTokenModal]  = useState(false);
//   const [newToken,        setNewToken]        = useState('');
//   const [newTokenType,    setNewTokenType]    = useState<'admin' | 'storefront'>('admin');
//   const [tokenName,       setTokenName]       = useState('');
//   const [selectedScopes,  setSelectedScopes]  = useState<string[]>([]);
//   const [expiryDate,      setExpiryDate]      = useState<string>('');
  
//   const handleCreate = useCallback(() => {
//     const formId = selectedTab === 0 ? 'create-admin-form' : 'create-storefront-form';
//     const form   = document.getElementById(formId) as HTMLFormElement;
//     if (form) form.requestSubmit();
//     setShowCreateModal(false);
//   }, [selectedTab]);
  
//   const handleDelete = useCallback((tokenId: number, type: 'admin' | 'storefront') => {
//     if (confirm('Are you sure you want to delete this token?')) {
//       const form = document.getElementById(`delete-form-${type}-${tokenId}`) as HTMLFormElement;
//       if (form) form.requestSubmit();
//     }
//   }, []);
  
//   useEffect(() => {
//     if (actionData && "token" in actionData) {
//       setNewToken(actionData.token);
//       setNewTokenType(actionData.tokenType);
//       setShowTokenModal(true);
//       setTokenName('');
//       setSelectedScopes([]);
//       setExpiryDate('');
//     }
//   }, [actionData]);

//   const tabs = [
//     { id: 'admin-tokens',      content: `Admin API (${adminTokens.length})` },
//     { id: 'storefront-tokens', content: `Storefront API (${storefrontTokens.length})` },
//   ];
  
//   const adminRows = adminTokens.map(token => [
//     token.tokenName,
//     token.scopes.join(', '),
//     new Date(token.createdAt).toLocaleDateString(),
//     token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never',
//     token.isActive ? 'Active' : 'Revoked',
//     <Form key={token.id} id={`delete-form-admin-${token.id}`} method="post" style={{ display: 'inline' }}>
//       <input type="hidden" name="intent"  value="delete-admin" />
//       <input type="hidden" name="tokenId" value={token.id} />
//       <Button tone="critical" onClick={() => handleDelete(token.id, 'admin')} submit>Delete</Button>
//     </Form>
//   ]);

//   const storefrontRows = storefrontTokens.map(token => [
//     token.tokenName,
//     new Date(token.createdAt).toLocaleDateString(),
//     token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never',
//     token.isActive ? 'Active' : 'Revoked',
//     <Form key={token.id} id={`delete-form-storefront-${token.id}`} method="post" style={{ display: 'inline' }}>
//       <input type="hidden" name="intent"  value="delete-storefront" />
//       <input type="hidden" name="tokenId" value={token.id} />
//       <Button tone="critical" onClick={() => handleDelete(token.id, 'storefront')} submit>Delete</Button>
//     </Form>
//   ]);
  
//   return (
//     <Page
//       title="API Token Manager"
//       primaryAction={{ content: 'Create Token', onAction: () => setShowCreateModal(true) }}
//     >
//       <Layout>
//         <Layout.Section>
//           <div style={{ marginBottom: '1rem' }}>
//             <Banner tone="info">
//               <p>
//                 Each token creation requires a one-time payment of <strong>$5.00 USD</strong>.
//                 You will be redirected to Shopify to approve the charge — token activates after payment.
//               </p>
//             </Banner>
//           </div>

//           {actionData && "error" in actionData && (
//             <div style={{ marginBottom: '1rem' }}>
//               <Banner tone="critical"><p>{actionData.error}</p></Banner>
//             </div>
//           )}
          
//           <Card>
//             <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
//               {selectedTab === 0 && (
//                 <div style={{ padding: '16px' }}>
//                   <Text as="h2" variant="headingMd">Admin API Tokens</Text>
//                   <Text as="p" variant="bodyMd">
//                     Admin API tokens allow backend applications to manage your store.
//                   </Text>
//                   <div style={{ marginTop: '1rem' }}>
//                     {adminTokens.length === 0 ? (
//                       <Text as="p">No admin tokens yet. Create your first one!</Text>
//                     ) : (
//                       <DataTable
//                         columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
//                         headings={['Name', 'Scopes', 'Created', 'Expires', 'Status', 'Actions']}
//                         rows={adminRows}
//                       />
//                     )}
//                   </div>
//                 </div>
//               )}
              
//               {selectedTab === 1 && (
//                 <div style={{ padding: '16px' }}>
//                   <Text as="h2" variant="headingMd">Storefront API Tokens</Text>
//                   <Text as="p" variant="bodyMd">
//                     Storefront API tokens allow headless storefronts and mobile apps to access public store data.
//                   </Text>
//                   <div style={{ marginTop: '1rem' }}>
//                     {storefrontTokens.length === 0 ? (
//                       <Text as="p">No storefront tokens yet. Create your first one!</Text>
//                     ) : (
//                       <DataTable
//                         columnContentTypes={['text', 'text', 'text', 'text', 'text']}
//                         headings={['Name', 'Created', 'Expires', 'Status', 'Actions']}
//                         rows={storefrontRows}
//                       />
//                     )}
//                   </div>
//                 </div>
//               )}
//             </Tabs>
//           </Card>
//         </Layout.Section>
//       </Layout>
      
//       {/* Create Token Modal */}
//       <Modal
//         open={showCreateModal}
//         onClose={() => { setShowCreateModal(false); setTokenName(''); setSelectedScopes([]); setExpiryDate(''); }}
//         title={selectedTab === 0 ? 'Create Admin API Token' : 'Create Storefront API Token'}
//         primaryAction={{
//           content:  'Create & Pay $5.00',
//           onAction: handleCreate,
//           disabled: !tokenName || (selectedTab === 0 && selectedScopes.length === 0)
//         }}
//         secondaryActions={[{
//           content: 'Cancel',
//           onAction: () => { setShowCreateModal(false); setTokenName(''); setSelectedScopes([]); setExpiryDate(''); },
//         }]}
//       >
//         <Modal.Section>
//           {selectedTab === 0 && (
//             <Form id="create-admin-form" method="post">
//               <input type="hidden" name="intent"     value="create-admin" />
//               <input type="hidden" name="tokenName"  value={tokenName} />
//               <input type="hidden" name="scopes"     value={JSON.stringify(selectedScopes)} />
//               <input type="hidden" name="expiryDate" value={expiryDate} />
//               <FormLayout>
//                 <TextField
//                   label="Token Name"
//                   value={tokenName}
//                   onChange={setTokenName}
//                   placeholder="e.g., Inventory Management System"
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Expiry Date (Optional)"
//                   type="date"
//                   value={expiryDate}
//                   onChange={setExpiryDate}
//                   helpText="Leave blank if token should never expire"
//                   autoComplete="off"
//                 />
//                 <ChoiceList
//                   title="Permissions (Scopes)"
//                   choices={AVAILABLE_SCOPES}
//                   selected={selectedScopes}
//                   onChange={setSelectedScopes}
//                   allowMultiple
//                 />
//               </FormLayout>
//             </Form>
//           )}
          
//           {selectedTab === 1 && (
//             <Form id="create-storefront-form" method="post">
//               <input type="hidden" name="intent"     value="create-storefront" />
//               <input type="hidden" name="tokenName"  value={tokenName} />
//               <input type="hidden" name="expiryDate" value={expiryDate} />
//               <FormLayout>
//                 <TextField
//                   label="Token Name"
//                   value={tokenName}
//                   onChange={setTokenName}
//                   placeholder="e.g., Mobile App v2"
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Expiry Date (Optional)"
//                   type="date"
//                   value={expiryDate}
//                   onChange={setExpiryDate}
//                   helpText="Leave blank if token should never expire"
//                   autoComplete="off"
//                 />
//                 <Banner>
//                   <p>Storefront tokens have predefined public access scopes for reading products, collections, and creating checkouts.</p>
//                 </Banner>
//               </FormLayout>
//             </Form>
//           )}
//         </Modal.Section>
//       </Modal>
      
//       {/* Show Token Once Modal (fallback only) */}
//       <Modal
//         open={showTokenModal}
//         onClose={() => setShowTokenModal(false)}
//         title="💾 Save Your Token"
//       >
//         <Modal.Section>
//           <Banner tone="warning">
//             <p><strong>Copy this token now!</strong> For security reasons, it won't be shown again.</p>
//           </Banner>
//           <div style={{ marginTop: '1rem' }}>
//             <Text as="p" variant="bodyMd">
//               <strong>Type:</strong> {newTokenType === 'admin' ? 'Admin API' : 'Storefront API'}
//             </Text>
//           </div>
//           <div style={{ marginTop: '1rem' }}>
//             <TextField
//               label="Access Token"
//               value={newToken}
//               readOnly
//               autoComplete="off"
//               connectedRight={
//                 <Button onClick={() => { navigator.clipboard.writeText(newToken); alert('Copied to clipboard!'); }}>
//                   Copy
//                 </Button>
//               }
//             />
//           </div>
//         </Modal.Section>
//       </Modal>
//     </Page>
//   );
// }