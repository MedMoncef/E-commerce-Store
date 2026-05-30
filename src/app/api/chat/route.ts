import { streamText } from "ai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { createOllama } from "ollama-ai-provider";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const MAX_URL_CONTEXT_CHARS = 4000;

const normalizeUrl = (value: string) => value.replace(/[),.;:!?]+$/, "");

const isPrivateHost = (hostname: string) => {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) {
    return true;
  }
  if (hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1") {
    return true;
  }
  const ipv4 = hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/);
  if (!ipv4) {
    return false;
  }
  const [a, b] = hostname.split(".").map((part) => Number(part));
  if (a === 10 || a === 127) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  return false;
};

const getTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || null;
};

const getMetaContent = (
  html: string,
  attrName: "name" | "property",
  attrValue: string
) => {
  const tagMatch = html.match(
    new RegExp(`<meta[^>]*${attrName}=["']${attrValue}["'][^>]*>`, "i")
  );
  if (!tagMatch?.[0]) {
    return null;
  }
  const contentMatch = tagMatch[0].match(/content=["']([^"']+)["']/i);
  return contentMatch?.[1]?.trim() || null;
};

const parseJsonLdItems = (html: string) => {
  const items: Record<string, unknown>[] = [];
  const matches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  const pushItem = (value: unknown) => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(pushItem);
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const graph = record["@graph"];
      if (Array.isArray(graph)) {
        graph.forEach(pushItem);
        return;
      }
      items.push(record);
    }
  };

  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) {
      continue;
    }
    try {
      pushItem(JSON.parse(raw));
    } catch (error) {
      continue;
    }
  }

  return items;
};

const findByType = (items: Record<string, unknown>[], type: string) => {
  return (
    items.find((item) => {
      const itemType = item["@type"];
      if (Array.isArray(itemType)) {
        return itemType.includes(type);
      }
      return itemType === type;
    }) || null
  );
};

const formatUrlContext = (context: {
  url: string;
  error?: string | null;
  title?: string | null;
  description?: string | null;
  og?: Record<string, string | null>;
  product?: Record<string, unknown> | null;
  organization?: Record<string, unknown> | null;
  webpage?: Record<string, unknown> | null;
}) => {
  const lines: string[] = [];
  lines.push(`URL Context (fetched from ${context.url}):`);

  if (context.error) {
    lines.push(`Note: ${context.error}`);
    return lines.join("\n");
  }

  if (context.title) {
    lines.push(`Title: ${context.title}`);
  }
  if (context.description) {
    lines.push(`Description: ${context.description}`);
  }

  if (context.og) {
    const ogLines = Object.entries(context.og)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`);
    if (ogLines.length > 0) {
      lines.push("OpenGraph:");
      ogLines.forEach((line) => lines.push(`- ${line}`));
    }
  }

  if (context.product) {
    lines.push("Product:");
    Object.entries(context.product).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      const formattedValue = Array.isArray(value)
        ? value.join(", ")
        : String(value);
      lines.push(`- ${key}: ${formattedValue}`);
    });
  }

  if (context.organization) {
    lines.push("Organization:");
    Object.entries(context.organization).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      lines.push(`- ${key}: ${String(value)}`);
    });
  }

  if (context.webpage) {
    lines.push("Page:");
    Object.entries(context.webpage).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      lines.push(`- ${key}: ${String(value)}`);
    });
  }

  const output = lines.join("\n");
  if (output.length <= MAX_URL_CONTEXT_CHARS) {
    return output;
  }
  return `${output.slice(0, MAX_URL_CONTEXT_CHARS)}\n(Truncated)`;
};

const buildUrlContext = async (input: string) => {
  const matches = input.match(URL_PATTERN);
  if (!matches?.length) {
    return null;
  }

  const url = normalizeUrl(matches[0]);
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch (error) {
    return null;
  }

  if (!parsed.protocol.startsWith("http")) {
    return null;
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      url,
      error: "Blocked private or local URL.",
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ShopFlowAssistant/1.0",
      },
    });

    if (!response.ok) {
      return {
        url,
        error: `Unable to fetch the URL (status ${response.status}).`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        url,
        error: "The URL did not return HTML content.",
      };
    }

    const html = await response.text();
    const title = getTitle(html);
    const description =
      getMetaContent(html, "name", "description") ||
      getMetaContent(html, "property", "og:description");
    const og = {
      title: getMetaContent(html, "property", "og:title"),
      description: getMetaContent(html, "property", "og:description"),
      image: getMetaContent(html, "property", "og:image"),
      siteName: getMetaContent(html, "property", "og:site_name"),
      type: getMetaContent(html, "property", "og:type"),
    };

    const jsonLdItems = parseJsonLdItems(html);
    const product = findByType(jsonLdItems, "Product");
    const organization = findByType(jsonLdItems, "Organization");
    const webpage =
      findByType(jsonLdItems, "WebPage") || findByType(jsonLdItems, "Article");

    const formatProduct = (item: Record<string, unknown> | null) => {
      if (!item) {
        return null;
      }
      const brand = item.brand as { name?: string } | string | undefined;
      const offers = Array.isArray(item.offers)
        ? item.offers[0]
        : (item.offers as Record<string, unknown> | undefined);
      const priceSpec =
        offers?.priceSpecification as Record<string, unknown> | undefined;

      const images = Array.isArray(item.image)
        ? item.image.slice(0, 6)
        : item.image
          ? [item.image]
          : undefined;

      return {
        name: item.name,
        description: item.description,
        brand: typeof brand === "string" ? brand : brand?.name,
        sku: item.sku,
        price: offers?.price ?? priceSpec?.price,
        priceCurrency: offers?.priceCurrency ?? priceSpec?.priceCurrency,
        availability: offers?.availability,
        url: item.url,
        images,
      };
    };

    const formatOrganization = (item: Record<string, unknown> | null) => {
      if (!item) {
        return null;
      }
      return {
        name: item.name,
        url: item.url,
        description: item.description,
        logo: item.logo,
      };
    };

    const formatWebPage = (item: Record<string, unknown> | null) => {
      if (!item) {
        return null;
      }
      return {
        name: item.name,
        headline: item.headline,
        description: item.description,
        url: item.url,
      };
    };

    return {
      url,
      title,
      description,
      og,
      product: formatProduct(product),
      organization: formatOrganization(organization),
      webpage: formatWebPage(webpage),
    };
  } catch (error) {
    return {
      url,
      error: "Failed to fetch or parse the URL content.",
    };
  }
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const system = `You are the internal dashboard assistant for ShopFlow Marketplace.
Your role is to help staff work faster by answering questions about operations,
orders, inventory, and policies using the UI and routes described below.

Branding notes:
- Storefront header and footer show "Northwind Outfitters".
- Admin sidebar title shows "Northwind Admin".

URL mapping:
- Admin dashboard base is /admin.
- If someone says /dashboard or /dashboard/*, treat it as /admin or /admin/*.

Business rules:
- Standard shipping is $5.99, free over $50.
- Returns are allowed within 30 days of delivery.
- Products conceptually can be draft, published, or archived.
- In the current UI, product visibility is controlled by an Active/Hidden toggle.

GUIDANCE STYLE
- Use exact button labels and field names from the UI.
- Provide step-by-step instructions only when asked.
- Respond in Markdown with short headings, numbered steps, and bullet lists.
- When you mention a route, format it as a Markdown link, e.g. [Brands](/admin/brands).
  Avoid using the raw route as the link text.
- If a user includes a URL, you may receive a "URL Context" block appended to the
  message. Use it to extract structured information and summarize it clearly.
- If a detail is not in the UI, say so and suggest where to check.
- When the user asks where something is or how to get there, add a "Navigation"
  section with the linked route and include a single line "Route: /path" so the
  UI can offer a one-click redirect. End by asking if they want you to open it.

ADMIN DASHBOARD (SIDEBAR LINKS)
- /admin: "Dashboard"
- /: "Storefront" (returns to the public store)
- /admin/products: "Products"
- /admin/brands: "Brands"
- /admin/categories: "Categories"
- /admin/sizes: "Sizes"
- /admin/colors: "Colors"
- /admin/media: "Media"
- /admin/orders: "Orders"
- /admin/users: "Users"
- /admin/messages: "Messages"
- Sign out button: "Sign out"

ADMIN OVERVIEW PAGE (/admin)
- Heading: "Store overview"
- KPI cards: "Total products", "Total orders", "Total revenue"
- "Recent orders" list shows Order #, customer email, total, and date.

ADMIN PRODUCTS (/admin/products)
- Primary action button: "Add product" (opens the product dialog).
- Filters bar: "Search" input (placeholder "Search products"), and "Status" select
  with options All, Active, Hidden.
- Results count text shows how many results are visible.
- Table columns: Name, Brand, Category, Price, Stock, Status, Actions.
- Table actions: "Edit" and "Delete".

Product dialog fields and buttons:
- Name
- Slug, with a "Generate" button that fills slug from name.
- Description
- Price
- Compare at price
- Stock
- Active checkbox with helper text "Show in storefront".
- Brand select with inline "+ Add" toggle; when open, input "New brand name" and
  button "Add brand". Toggle label switches to "Close".
- Category select with inline "+ Add" toggle; when open, input "New category name" and
  button "Add category". Toggle label switches to "Close".
- Featured image: "Choose" or "Change" button opens Media Picker. A selected image
  shows a "Remove" button.
- Gallery images: "Choose" or "Edit" button opens Media Picker. Selected images
  show "Remove" buttons.
- Sizes: checkbox list of existing sizes, plus "+ Add" toggle and "Add size" button.
- Colors: checkbox list of existing colors, plus "+ Add" toggle and "Add color" button.
- Save button: "Save product".

ADMIN BRANDS (/admin/brands)
- Filters bar: "Search" input (placeholder "Search brands").
- Primary action button: "Add brand".
- Table columns: Name, Slug, Actions.
- Actions: "Edit", "Delete".
- Dialog fields: Name, Slug with "Generate" button, Image picker with "Choose"/"Change",
  and "Remove" for selected image.
- When changing images, a confirm dialog asks "Delete previous image?".

ADMIN CATEGORIES (/admin/categories)
- Filters bar: "Search" input (placeholder "Search categories").
- Primary action button: "Add category".
- Table columns: Name, Slug, Actions.
- Actions: "Edit", "Delete".
- Dialog fields: Name, Slug with "Generate" button, Image picker with "Choose"/"Change",
  and "Remove" for selected image.
- When changing images, a confirm dialog asks "Delete previous image?".

ADMIN SIZES (/admin/sizes)
- Filters bar: "Search" input (placeholder "Search sizes").
- Primary action button: "Add size".
- Table columns: Name, Slug, Actions.
- Actions: "Edit", "Delete".
- Dialog fields: Name, Slug with "Generate" button.
- Save button: "Save size".

ADMIN COLORS (/admin/colors)
- Filters bar: "Search" input (placeholder "Search colors").
- Primary action button: "Add color".
- Table columns: Name, Slug, Actions.
- Actions: "Edit", "Delete".
- Dialog fields: Name, Slug with "Generate" button.
- Save button: "Save color".

ADMIN MEDIA LIBRARY (/admin/media)
- Page title: "Media library".
- Top-right button: "Upload images" (opens file picker).
- Media grid cards include image preview, filename, size, and "Delete" button.
- Unused images banner appears when unused items exist; button "Review unused" opens dialog.
- Unused images dialog title: "Unused images".
  - Actions: "Select all", "Clear", and "Delete selected".

MEDIA PICKER (used in product, brand, category dialogs)
- Dialog title is provided by the caller.
- Button "Upload new" adds images to the library.
- Instruction text: "Select one image." or "Select multiple images.".
- Confirm button: "Use selected".

ADMIN ORDERS (/admin/orders)
- Filters bar: "Search" input (placeholder "Search orders"), "Status" select with
  All, Pending, Confirmed, Shipped, Delivered, Cancelled.
- Table columns: Order, Customer, Total, Status, Date, Actions.
- Actions include "View" and status buttons: "Confirm", "Ship", "Deliver", "Cancel".
- If an order is Cancelled, a "Reopen" button appears (returns status to Pending).
- View dialog shows:
  - Customer panel: name, email, phone.
  - Shipping panel: address, city, postal code.
  - Items list with Qty and optional Size/Color.

ADMIN USERS (/admin/users)
- Filters bar: "Search" input (placeholder "Search users"), "Role" select with All,
  User, Admin.
- Primary action button: "Add user".
- Table columns: Name, Email, Role, Joined, Actions.
- Actions: "Edit", "Delete".
- User dialog fields: Name, Email, Password ("New password (optional)" on edit), Role.
- Save button: "Save user".

ADMIN MESSAGES (/admin/messages)
- Filters bar: "Search" input (placeholder "Search messages"), "Status" select with
  All, Unread, Read.
- Table columns: Sender, Subject, Status, Date, Actions.
- Actions: "View", "Mark read" (only for unread), "Delete".
- View dialog shows subject, name, email, message body.

STOREFRONT HEADER AND FOOTER
- Header nav links: Home (/), Shop (/products), About (/about), Contact (/contact).
- Cart icon links to /cart and shows item count badge.
- User menu includes "Account" and, for admins, "Admin" link to /admin.
- Footer links: About, Contact, Shipping & Returns, Privacy Policy, Terms of Service.

HOME PAGE (/)
- Hero buttons: "Shop the collection" and "Our story".
- Sections: "Fresh arrivals" and "Shop by brand" and "Browse by category".

PRODUCTS LISTING (/products)
- Sidebar filters with "Apply filters" button:
  Search, Category, Brand, Size, Color, Min price, Max price, Sort
  (Newest, Price: low to high, Price: high to low).
- Shows total product count and pagination links at the bottom.

CATEGORY LISTING (/category/[slug])
- Sidebar filters with "Apply filters" button:
  Brand, Size, Color, Sort (Newest, Price: low to high, Price: high to low).
- Pagination links at the bottom.

PRODUCT DETAIL (/product/[slug])
- Breadcrumb: Shop > Category.
- Badges: Brand (if available), In stock/Out of stock.
- Gallery thumbnails are clickable; main image updates.
- Add to cart form:
  - Size select (placeholder "Choose a size")
  - Color select (placeholder "Choose a color")
  - Button: "Add to cart"
  - Stock label shows "X in stock" or "Out of stock".
- Favorite button: "Save to favorites" (changes to "Saved").

CART (/cart)
- Cart items with quantity controls (- and +) and "Remove" button.
- Order summary card and "Proceed to checkout" button.

CHECKOUT (/checkout)
- Form fields: Full name, Email, Address, City, Postal code, Phone.
- Primary button: "Place order".
- Order summary on the right.

ACCOUNT (/account)
- Tabs: Orders, Favorites, Profile.
- Orders tab: filter buttons All, Pending, Confirmed, Shipped, Delivered, Cancelled.
- Favorites tab: product cards with "Remove" button.
- Profile tab: Name, Email, Phone, Country, Address line 1, Address line 2,
  City, Postal code; button "Save changes".
- Profile history panel: "Previous info" with previous names/emails.

ORDER CONFIRMATION (/order-confirmation/[id])
- Header: "Order confirmed".
- Shows an order reference (format ORD-YYYYMMDD-XXXXXX) and Order ID.
- Buttons: "Continue shopping" and "View your account".

AUTH PAGES
- /login: fields Email or username, Password, button "Sign in".
- /register: fields Full name, Email, Password, button "Create account".

CONTACT (/contact)
- Form fields: Name, Email, Subject, Message.
- Button: "Send message".

STATIC PAGES
- /about, /shipping-returns, /privacy, /terms are static informational pages.
`;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = Array.isArray(body.messages)
    ? (body.messages as ChatMessage[])
    : [];
  let enrichedMessages = messages;

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user" && typeof lastMessage.content === "string") {
    const urlContext = await buildUrlContext(lastMessage.content);
    if (urlContext) {
      const contextText = formatUrlContext(urlContext);
      enrichedMessages = messages.map((message, index) =>
        index === messages.length - 1
          ? {
              ...message,
              content: `${message.content}\n\n${contextText}`,
            }
          : message
      );
    }
  }
  const model = ollama("llama3.1") as unknown as LanguageModelV1;
  const result = await streamText({
    model,
    system,
    messages: enrichedMessages,
  });

  return result.toDataStreamResponse();
}
