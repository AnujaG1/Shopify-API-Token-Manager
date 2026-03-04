var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// app/entry.server.tsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest,
  streamTimeout: () => streamTimeout
});
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";

// app/shopify.server.ts
import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";

// app/db.server.ts
import { PrismaClient } from "@prisma/client";
var prisma = global.__db__ ?? new PrismaClient();

// app/shopify.server.ts
var shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: !0
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
var apiVersion = ApiVersion.October25, addDocumentResponseHeaders = shopify.addDocumentResponseHeaders, authenticate = shopify.authenticate, unauthenticated = shopify.unauthenticated, login = shopify.login, registerWebhooks = shopify.registerWebhooks, sessionStorage = shopify.sessionStorage;

// app/entry.server.tsx
import { jsx } from "react/jsx-runtime";
var streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, reactRouterContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  let userAgent = request.headers.get("user-agent"), callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    let { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        ServerRouter,
        {
          context: reactRouterContext,
          url: request.url
        }
      ),
      {
        [callbackName]: () => {
          let body = new PassThrough(), stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html"), resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}

// app/root.tsx
var root_exports = {};
__export(root_exports, {
  default: () => App
});
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function App() {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx2("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx2("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx2("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }),
      /* @__PURE__ */ jsx2(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        }
      ),
      /* @__PURE__ */ jsx2(Meta, {}),
      /* @__PURE__ */ jsx2(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx2(Outlet, {}),
      /* @__PURE__ */ jsx2(ScrollRestoration, {}),
      /* @__PURE__ */ jsx2(Scripts, {})
    ] })
  ] });
}

// app/routes/webhooks.app.scopes_update.tsx
var webhooks_app_scopes_update_exports = {};
__export(webhooks_app_scopes_update_exports, {
  action: () => action
});
var action = async ({ request }) => {
  let { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  let current = payload.current;
  return session && await prisma.session.update({
    where: {
      id: session.id
    },
    data: {
      scope: current.toString()
    }
  }), new Response();
};

// app/routes/webhooks.app.uninstalled.tsx
var webhooks_app_uninstalled_exports = {};
__export(webhooks_app_uninstalled_exports, {
  action: () => action2
});
var action2 = async ({ request }) => {
  let { shop, session, topic } = await authenticate.webhook(request);
  return console.log(`Received ${topic} webhook for ${shop}`), session && await prisma.session.deleteMany({ where: { shop } }), new Response();
};

// app/routes/app.additional.tsx
var app_additional_exports = {};
__export(app_additional_exports, {
  default: () => AdditionalPage
});
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function AdditionalPage() {
  return /* @__PURE__ */ jsxs2("s-page", { heading: "Additional page", children: [
    /* @__PURE__ */ jsxs2("s-section", { heading: "Multiple pages", children: [
      /* @__PURE__ */ jsxs2("s-paragraph", { children: [
        "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
        " ",
        /* @__PURE__ */ jsx3(
          "s-link",
          {
            href: "https://shopify.dev/docs/apps/tools/app-bridge",
            target: "_blank",
            children: "App Bridge"
          }
        ),
        "."
      ] }),
      /* @__PURE__ */ jsxs2("s-paragraph", { children: [
        "To create your own page and have it show up in the app navigation, add a page inside ",
        /* @__PURE__ */ jsx3("code", { children: "app/routes" }),
        ", and a link to it in the",
        " ",
        /* @__PURE__ */ jsx3("code", { children: "<ui-nav-menu>" }),
        " component found in",
        " ",
        /* @__PURE__ */ jsx3("code", { children: "app/routes/app.jsx" }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsx3("s-section", { slot: "aside", heading: "Resources", children: /* @__PURE__ */ jsx3("s-unordered-list", { children: /* @__PURE__ */ jsx3("s-list-item", { children: /* @__PURE__ */ jsx3(
      "s-link",
      {
        href: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
        target: "_blank",
        children: "App nav best practices"
      }
    ) }) }) })
  ] });
}

// app/routes/app._index.tsx
var app_index_exports = {};
__export(app_index_exports, {
  action: () => action3,
  default: () => Index,
  headers: () => headers,
  loader: () => loader
});
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var loader = async ({ request }) => (await authenticate.admin(request), null), action3 = async ({ request }) => {
  let { admin } = await authenticate.admin(request), color = ["Red", "Orange", "Yellow", "Green"][Math.floor(Math.random() * 4)], responseJson = await (await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`
        }
      }
    }
  )).json(), product = responseJson.data.productCreate.product, variantId = product.variants.edges[0].node.id, variantResponseJson = await (await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }]
      }
    }
  )).json();
  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants
  };
};
function Index() {
  let fetcher = useFetcher(), shopify2 = useAppBridge(), isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";
  useEffect(() => {
    fetcher.data?.product?.id && shopify2.toast.show("Product created");
  }, [fetcher.data?.product?.id, shopify2]);
  let generateProduct = () => fetcher.submit({}, { method: "POST" });
  return /* @__PURE__ */ jsxs3("s-page", { heading: "Shopify app template", children: [
    /* @__PURE__ */ jsx4("s-button", { slot: "primary-action", onClick: generateProduct, children: "Generate a product" }),
    /* @__PURE__ */ jsx4("s-section", { heading: "Congrats on creating a new Shopify app \u{1F389}", children: /* @__PURE__ */ jsxs3("s-paragraph", { children: [
      "This embedded app template uses",
      " ",
      /* @__PURE__ */ jsx4(
        "s-link",
        {
          href: "https://shopify.dev/docs/apps/tools/app-bridge",
          target: "_blank",
          children: "App Bridge"
        }
      ),
      " ",
      "interface examples like an",
      " ",
      /* @__PURE__ */ jsx4("s-link", { href: "/app/additional", children: "additional page in the app nav" }),
      ", as well as an",
      " ",
      /* @__PURE__ */ jsx4(
        "s-link",
        {
          href: "https://shopify.dev/docs/api/admin-graphql",
          target: "_blank",
          children: "Admin GraphQL"
        }
      ),
      " ",
      "mutation demo, to provide a starting point for app development."
    ] }) }),
    /* @__PURE__ */ jsxs3("s-section", { heading: "Get started with products", children: [
      /* @__PURE__ */ jsxs3("s-paragraph", { children: [
        "Generate a product with GraphQL and get the JSON output for that product. Learn more about the",
        " ",
        /* @__PURE__ */ jsx4(
          "s-link",
          {
            href: "https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate",
            target: "_blank",
            children: "productCreate"
          }
        ),
        " ",
        "mutation in our API references."
      ] }),
      /* @__PURE__ */ jsxs3("s-stack", { direction: "inline", gap: "base", children: [
        /* @__PURE__ */ jsx4(
          "s-button",
          {
            onClick: generateProduct,
            ...isLoading ? { loading: !0 } : {},
            children: "Generate a product"
          }
        ),
        fetcher.data?.product && /* @__PURE__ */ jsx4(
          "s-button",
          {
            onClick: () => {
              shopify2.intents.invoke?.("edit:shopify/Product", {
                value: fetcher.data?.product?.id
              });
            },
            target: "_blank",
            variant: "tertiary",
            children: "Edit product"
          }
        )
      ] }),
      fetcher.data?.product && /* @__PURE__ */ jsx4("s-section", { heading: "productCreate mutation", children: /* @__PURE__ */ jsxs3("s-stack", { direction: "block", gap: "base", children: [
        /* @__PURE__ */ jsx4(
          "s-box",
          {
            padding: "base",
            borderWidth: "base",
            borderRadius: "base",
            background: "subdued",
            children: /* @__PURE__ */ jsx4("pre", { style: { margin: 0 }, children: /* @__PURE__ */ jsx4("code", { children: JSON.stringify(fetcher.data.product, null, 2) }) })
          }
        ),
        /* @__PURE__ */ jsx4("s-heading", { children: "productVariantsBulkUpdate mutation" }),
        /* @__PURE__ */ jsx4(
          "s-box",
          {
            padding: "base",
            borderWidth: "base",
            borderRadius: "base",
            background: "subdued",
            children: /* @__PURE__ */ jsx4("pre", { style: { margin: 0 }, children: /* @__PURE__ */ jsx4("code", { children: JSON.stringify(fetcher.data.variant, null, 2) }) })
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs3("s-section", { slot: "aside", heading: "App template specs", children: [
      /* @__PURE__ */ jsxs3("s-paragraph", { children: [
        /* @__PURE__ */ jsx4("s-text", { children: "Framework: " }),
        /* @__PURE__ */ jsx4("s-link", { href: "https://reactrouter.com/", target: "_blank", children: "React Router" })
      ] }),
      /* @__PURE__ */ jsxs3("s-paragraph", { children: [
        /* @__PURE__ */ jsx4("s-text", { children: "Interface: " }),
        /* @__PURE__ */ jsx4(
          "s-link",
          {
            href: "https://shopify.dev/docs/api/app-home/using-polaris-components",
            target: "_blank",
            children: "Polaris web components"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("s-paragraph", { children: [
        /* @__PURE__ */ jsx4("s-text", { children: "API: " }),
        /* @__PURE__ */ jsx4(
          "s-link",
          {
            href: "https://shopify.dev/docs/api/admin-graphql",
            target: "_blank",
            children: "GraphQL"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("s-paragraph", { children: [
        /* @__PURE__ */ jsx4("s-text", { children: "Database: " }),
        /* @__PURE__ */ jsx4("s-link", { href: "https://www.prisma.io/", target: "_blank", children: "Prisma" })
      ] })
    ] }),
    /* @__PURE__ */ jsx4("s-section", { slot: "aside", heading: "Next steps", children: /* @__PURE__ */ jsxs3("s-unordered-list", { children: [
      /* @__PURE__ */ jsxs3("s-list-item", { children: [
        "Build an",
        " ",
        /* @__PURE__ */ jsx4(
          "s-link",
          {
            href: "https://shopify.dev/docs/apps/getting-started/build-app-example",
            target: "_blank",
            children: "example app"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("s-list-item", { children: [
        "Explore Shopify's API with",
        " ",
        /* @__PURE__ */ jsx4(
          "s-link",
          {
            href: "https://shopify.dev/docs/apps/tools/graphiql-admin-api",
            target: "_blank",
            children: "GraphiQL"
          }
        )
      ] })
    ] }) })
  ] });
}
var headers = (headersArgs) => boundary.headers(headersArgs);

// app/routes/app.tokens.tsx
var app_tokens_exports = {};
__export(app_tokens_exports, {
  action: () => action4,
  default: () => TokensPage,
  loader: () => loader2
});
import { data } from "react-router";
import { useLoaderData, useActionData, Form } from "react-router";
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
  Text
} from "@shopify/polaris";
import { useState, useCallback, useEffect as useEffect2 } from "react";

// app/models/token.server.ts
async function getTokensByShop(shop) {
  return (await prisma.generatedToken.findMany({
    where: {
      shop,
      // Match this shop
      isActive: !0
      // Only active tokens
    },
    orderBy: {
      createdAt: "desc"
      // Newest first
    }
  })).map((token) => ({
    ...token,
    // Copy all fields
    scopes: JSON.parse(token.scopes)
    // Parse JSON
  }));
}
async function createToken(data2) {
  return await prisma.generatedToken.create({
    data: {
      shop: data2.shop,
      tokenName: data2.tokenName,
      delegateAccessTokenId: data2.delegateAccessTokenId,
      delegateAccessToken: data2.delegateAccessToken,
      accessToken: data2.accessToken,
      scopes: JSON.stringify(data2.scopes),
      // Convert array to JSON string
      expiresAt: data2.expiresAt,
      createdBy: data2.createdBy
    }
  });
}
async function deleteToken(id) {
  return await prisma.generatedToken.delete({
    where: { id }
  });
}

// app/routes/app.tokens.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var AVAILABLE_SCOPES = [
  { label: "Read Products", value: "read_products" },
  { label: "Write Products", value: "write_products" },
  { label: "Read Orders", value: "read_orders" },
  { label: "Write Orders", value: "write_orders" },
  { label: "Read Customers", value: "read_customers" },
  { label: "Write Customers", value: "write_customers" },
  { label: "Read Inventory", value: "read_inventory" },
  { label: "Write Inventory", value: "write_inventory" }
];
async function loader2({ request }) {
  let { session } = await authenticate.admin(request), tokens = await getTokensByShop(session.shop);
  return data({
    tokens,
    shop: session.shop
    // Also send shop name (useful for debugging)
  });
}
async function action4({ request }) {
  let { admin, session } = await authenticate.admin(request), formData = await request.formData(), intent = String(formData.get("intent"));
  if (intent === "create")
    try {
      let tokenName = String(formData.get("tokenName")), scopesJson = String(formData.get("scopes")), scopes = JSON.parse(scopesJson);
      if (!tokenName || tokenName.length < 3)
        return data({
          error: "Token name must be at least 3 characters"
        }, { status: 400 });
      if (!scopes || scopes.length === 0)
        return data({
          error: "Please select at least one permission"
        }, { status: 400 });
      let result = await (await admin.graphql(
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
              delegateAccessScope: scopes
              // Note: Delegate access tokens don't support titles in Shopify API
              // We'll store the tokenName in our database instead
            }
          }
        }
      )).json(), { delegateAccessToken, userErrors } = result.data.delegateAccessTokenCreate;
      if (userErrors && userErrors.length > 0)
        return data({
          error: userErrors[0].message
        }, { status: 400 });
      let uniqueTokenId = `${session.shop}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return await createToken({
        shop: session.shop,
        tokenName,
        delegateAccessTokenId: uniqueTokenId,
        delegateAccessToken: delegateAccessToken.accessToken,
        accessToken: session.accessToken ?? "",
        scopes,
        createdBy: session.shop
      }), data({
        success: !0,
        token: delegateAccessToken.accessToken,
        tokenId: uniqueTokenId
      });
    } catch (error) {
      return console.error("Error creating token:", error), data({
        error: "Failed to create token. Please try again."
      }, { status: 500 });
    }
  if (intent === "delete")
    try {
      let tokenId = parseInt(String(formData.get("tokenId")));
      return await deleteToken(tokenId), data({ success: !0 });
    } catch (error) {
      return console.error("Error deleting token:", error), data({
        error: "Failed to delete token. Please try again."
      }, { status: 500 });
    }
  return data({
    error: "Invalid action"
  }, { status: 400 });
}
function TokensPage() {
  let { tokens } = useLoaderData(), actionData = useActionData(), [showCreateModal, setShowCreateModal] = useState(!1), [showTokenModal, setShowTokenModal] = useState(!1), [newToken, setNewToken] = useState(""), [tokenName, setTokenName] = useState(""), [selectedScopes, setSelectedScopes] = useState([]), handleCreate = useCallback(() => {
    let form = document.getElementById("create-token-form");
    form && form.requestSubmit(), setShowCreateModal(!1);
  }, []), handleDelete = useCallback((tokenId) => {
    if (confirm("Are you sure you want to delete this token?")) {
      let form = document.getElementById(`delete-form-${tokenId}`);
      form && form.requestSubmit();
    }
  }, []);
  useEffect2(() => {
    actionData && "token" in actionData && (setNewToken(actionData.token), setShowTokenModal(!0));
  }, [actionData]);
  let rows = tokens.map((token) => [
    token.tokenName,
    token.scopes.join(", "),
    new Date(token.createdAt).toLocaleDateString(),
    token.isActive ? "Active" : "Revoked",
    /* @__PURE__ */ jsxs4(Form, { id: `delete-form-${token.id}`, method: "post", style: { display: "inline" }, children: [
      /* @__PURE__ */ jsx5("input", { type: "hidden", name: "intent", value: "delete" }),
      /* @__PURE__ */ jsx5("input", { type: "hidden", name: "tokenId", value: token.id }),
      /* @__PURE__ */ jsx5(
        Button,
        {
          tone: "critical",
          onClick: () => handleDelete(token.id),
          submit: !0,
          children: "Delete"
        }
      )
    ] }, token.id)
  ]);
  return /* @__PURE__ */ jsxs4(
    Page,
    {
      title: "API Token Manager",
      primaryAction: {
        content: "Create Token",
        onAction: () => setShowCreateModal(!0)
      },
      children: [
        /* @__PURE__ */ jsx5(Layout, { children: /* @__PURE__ */ jsxs4(Layout.Section, { children: [
          actionData && "error" in actionData && /* @__PURE__ */ jsx5(Banner, { tone: "critical", children: /* @__PURE__ */ jsx5("p", { children: actionData.error }) }),
          /* @__PURE__ */ jsx5(Card, { children: tokens.length === 0 ? /* @__PURE__ */ jsx5(Text, { as: "p", children: "No tokens yet. Create your first token!" }) : /* @__PURE__ */ jsx5(
            DataTable,
            {
              columnContentTypes: ["text", "text", "text", "text", "text"],
              headings: ["Name", "Scopes", "Created", "Status", "Actions"],
              rows
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsx5(
          Modal,
          {
            open: showCreateModal,
            onClose: () => setShowCreateModal(!1),
            title: "Create New API Token",
            primaryAction: {
              content: "Create",
              onAction: handleCreate,
              disabled: !tokenName || selectedScopes.length === 0
            },
            secondaryActions: [{
              content: "Cancel",
              onAction: () => setShowCreateModal(!1)
            }],
            children: /* @__PURE__ */ jsx5(Modal.Section, { children: /* @__PURE__ */ jsxs4(Form, { id: "create-token-form", method: "post", children: [
              /* @__PURE__ */ jsx5("input", { type: "hidden", name: "intent", value: "create" }),
              /* @__PURE__ */ jsx5("input", { type: "hidden", name: "tokenName", value: tokenName }),
              /* @__PURE__ */ jsx5("input", { type: "hidden", name: "scopes", value: JSON.stringify(selectedScopes) }),
              /* @__PURE__ */ jsxs4(FormLayout, { children: [
                /* @__PURE__ */ jsx5(
                  TextField,
                  {
                    label: "Token Name",
                    value: tokenName,
                    onChange: setTokenName,
                    placeholder: "e.g., Mobile App Token",
                    autoComplete: "off"
                  }
                ),
                /* @__PURE__ */ jsx5(
                  ChoiceList,
                  {
                    title: "Permissions (Scopes)",
                    choices: AVAILABLE_SCOPES,
                    selected: selectedScopes,
                    onChange: setSelectedScopes,
                    allowMultiple: !0
                  }
                )
              ] })
            ] }) })
          }
        ),
        /* @__PURE__ */ jsx5(
          Modal,
          {
            open: showTokenModal,
            onClose: () => setShowTokenModal(!1),
            title: " Save Your Token",
            children: /* @__PURE__ */ jsxs4(Modal.Section, { children: [
              /* @__PURE__ */ jsx5(Banner, { tone: "warning", children: /* @__PURE__ */ jsxs4("p", { children: [
                /* @__PURE__ */ jsx5("strong", { children: "Copy this token now!" }),
                " For security reasons, it won't be shown again."
              ] }) }),
              /* @__PURE__ */ jsx5("div", { style: { marginTop: "1rem" }, children: /* @__PURE__ */ jsx5(
                TextField,
                {
                  label: "Access Token",
                  value: newToken,
                  readOnly: !0,
                  autoComplete: "off",
                  connectedRight: /* @__PURE__ */ jsx5(Button, { onClick: () => {
                    navigator.clipboard.writeText(newToken), alert("Copied to clipboard!");
                  }, children: "Copy" })
                }
              ) })
            ] })
          }
        )
      ]
    }
  );
}

// app/routes/auth.login/route.tsx
var route_exports = {};
__export(route_exports, {
  action: () => action5,
  default: () => Auth,
  loader: () => loader3
});
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState as useState2 } from "react";
import { Form as Form2, useActionData as useActionData2, useLoaderData as useLoaderData2 } from "react-router";

// app/routes/auth.login/error.server.tsx
import { LoginErrorType } from "@shopify/shopify-app-react-router/server";
function loginErrorMessage(loginErrors) {
  return loginErrors?.shop === LoginErrorType.MissingShop ? { shop: "Please enter your shop domain to log in" } : loginErrors?.shop === LoginErrorType.InvalidShop ? { shop: "Please enter a valid shop domain to log in" } : {};
}

// app/routes/auth.login/route.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var loader3 = async ({ request }) => ({ errors: loginErrorMessage(await login(request)) }), action5 = async ({ request }) => ({
  errors: loginErrorMessage(await login(request))
});
function Auth() {
  let loaderData = useLoaderData2(), actionData = useActionData2(), [shop, setShop] = useState2(""), { errors } = actionData || loaderData;
  return /* @__PURE__ */ jsx6(AppProvider, { embedded: !1, children: /* @__PURE__ */ jsx6("s-page", { children: /* @__PURE__ */ jsx6(Form2, { method: "post", children: /* @__PURE__ */ jsxs5("s-section", { heading: "Log in", children: [
    /* @__PURE__ */ jsx6(
      "s-text-field",
      {
        name: "shop",
        label: "Shop domain",
        details: "example.myshopify.com",
        value: shop,
        onChange: (e) => setShop(e.currentTarget.value),
        autocomplete: "on",
        error: errors.shop
      }
    ),
    /* @__PURE__ */ jsx6("s-button", { type: "submit", children: "Log in" })
  ] }) }) }) });
}

// app/routes/_index/route.tsx
var route_exports2 = {};
__export(route_exports2, {
  default: () => App2,
  loader: () => loader4
});
import { redirect, Form as Form3, useLoaderData as useLoaderData3 } from "react-router";

// app/routes/_index/styles.module.css
var styles_module_default = { index: "LQCYp", heading: "bVg-E", text: "_5LEJl", content: "IjJz7", form: "sI1Wg", label: "py2aZ", input: "k8y5b", button: "DcRe8", list: "qyGLW" };

// app/routes/_index/route.tsx
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var loader4 = async ({ request }) => {
  let url = new URL(request.url);
  if (url.searchParams.get("shop"))
    throw redirect(`/app?${url.searchParams.toString()}`);
  return { showForm: Boolean(login) };
};
function App2() {
  let { showForm } = useLoaderData3();
  return /* @__PURE__ */ jsx7("div", { className: styles_module_default.index, children: /* @__PURE__ */ jsxs6("div", { className: styles_module_default.content, children: [
    /* @__PURE__ */ jsx7("h1", { className: styles_module_default.heading, children: "A short heading about [your app]" }),
    /* @__PURE__ */ jsx7("p", { className: styles_module_default.text, children: "A tagline about [your app] that describes your value proposition." }),
    showForm && /* @__PURE__ */ jsxs6(Form3, { className: styles_module_default.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsxs6("label", { className: styles_module_default.label, children: [
        /* @__PURE__ */ jsx7("span", { children: "Shop domain" }),
        /* @__PURE__ */ jsx7("input", { className: styles_module_default.input, type: "text", name: "shop" }),
        /* @__PURE__ */ jsx7("span", { children: "e.g: my-shop-domain.myshopify.com" })
      ] }),
      /* @__PURE__ */ jsx7("button", { className: styles_module_default.button, type: "submit", children: "Log in" })
    ] }),
    /* @__PURE__ */ jsxs6("ul", { className: styles_module_default.list, children: [
      /* @__PURE__ */ jsxs6("li", { children: [
        /* @__PURE__ */ jsx7("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs6("li", { children: [
        /* @__PURE__ */ jsx7("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs6("li", { children: [
        /* @__PURE__ */ jsx7("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] })
    ] })
  ] }) });
}

// app/routes/auth.$.tsx
var auth_exports = {};
__export(auth_exports, {
  headers: () => headers2,
  loader: () => loader5
});
import { boundary as boundary2 } from "@shopify/shopify-app-react-router/server";
var loader5 = async ({ request }) => (await authenticate.admin(request), null), headers2 = (headersArgs) => boundary2.headers(headersArgs);

// app/routes/app.tsx
var app_exports = {};
__export(app_exports, {
  ErrorBoundary: () => ErrorBoundary,
  default: () => App3,
  headers: () => headers3,
  loader: () => loader6
});
import { Outlet as Outlet2, useLoaderData as useLoaderData4, useRouteError } from "react-router";
import { boundary as boundary3 } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var loader6 = async ({ request }) => (await authenticate.admin(request), { apiKey: process.env.SHOPIFY_API_KEY || "" });
function App3() {
  let { apiKey } = useLoaderData4();
  return /* @__PURE__ */ jsx8(ShopifyAppProvider, { embedded: !0, apiKey, children: /* @__PURE__ */ jsxs7(PolarisAppProvider, { i18n: polarisTranslations, children: [
    /* @__PURE__ */ jsxs7(NavMenu, { children: [
      /* @__PURE__ */ jsx8("a", { href: "/app", rel: "home", children: "Home" }),
      /* @__PURE__ */ jsx8("a", { href: "/app/tokens", children: "API Tokens" })
    ] }),
    /* @__PURE__ */ jsx8(Outlet2, {})
  ] }) });
}
function ErrorBoundary() {
  return boundary3.error(useRouteError());
}
var headers3 = (headersArgs) => boundary3.headers(headersArgs);

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-XN56E2M6.js", imports: ["/build/_shared/chunk-Q3IECNXJ.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-5MML6FB5.js", imports: ["/build/_shared/chunk-GROB6QBB.js", "/build/_shared/chunk-4HXKWYDW.js"], hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_index": { id: "routes/_index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_index-2CXSJ22N.js", imports: ["/build/_shared/chunk-WK3XIJ7S.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app": { id: "routes/app", parentId: "root", path: "app", index: void 0, caseSensitive: void 0, module: "/build/routes/app-VP7HHA4S.js", imports: ["/build/_shared/chunk-YZ4RE2YV.js", "/build/_shared/chunk-2PZ7XJQ7.js", "/build/_shared/chunk-WF3ETG76.js", "/build/_shared/chunk-4ZIU2K7Q.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !0 }, "routes/app._index": { id: "routes/app._index", parentId: "routes/app", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/app._index-BFJXM4WT.js", imports: ["/build/_shared/chunk-GROB6QBB.js", "/build/_shared/chunk-4HXKWYDW.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.additional": { id: "routes/app.additional", parentId: "routes/app", path: "additional", index: void 0, caseSensitive: void 0, module: "/build/routes/app.additional-3HK7RSQA.js", imports: ["/build/_shared/chunk-4HXKWYDW.js"], hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.tokens": { id: "routes/app.tokens", parentId: "routes/app", path: "tokens", index: void 0, caseSensitive: void 0, module: "/build/routes/app.tokens-NAC7EBTR.js", imports: ["/build/_shared/chunk-GROB6QBB.js", "/build/_shared/chunk-4HXKWYDW.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.$": { id: "routes/auth.$", parentId: "root", path: "auth/*", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.$-QXGTKEOT.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.login": { id: "routes/auth.login", parentId: "root", path: "auth/login", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.login-ZB5WI4CB.js", imports: ["/build/_shared/chunk-WK3XIJ7S.js", "/build/_shared/chunk-4ZIU2K7Q.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.app.scopes_update": { id: "routes/webhooks.app.scopes_update", parentId: "root", path: "webhooks/app/scopes_update", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.app.scopes_update-K4Z5TTEL.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.app.uninstalled": { id: "routes/webhooks.app.uninstalled", parentId: "root", path: "webhooks/app/uninstalled", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.app.uninstalled-TJ3YRG4B.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "5560cad5", hmr: void 0, url: "/build/manifest-5560CAD5.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "production", assetsBuildDirectory = "public/build", future = { v3_fetcherPersist: !1, v3_relativeSplatPath: !1, v3_throwAbortReason: !1, v3_routeConfig: !1, v3_singleFetch: !1, v3_lazyRouteDiscovery: !1, unstable_optimizeDeps: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_app_scopes_update_exports
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_app_uninstalled_exports
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: app_additional_exports
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: app_index_exports
  },
  "routes/app.tokens": {
    id: "routes/app.tokens",
    parentId: "routes/app",
    path: "tokens",
    index: void 0,
    caseSensitive: void 0,
    module: app_tokens_exports
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route_exports
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: route_exports2
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: auth_exports
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: app_exports
  }
};
export {
  assets_manifest_default as assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
};
