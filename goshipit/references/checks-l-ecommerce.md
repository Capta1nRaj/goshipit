# Category L - E-commerce Tracking _(only if e-commerce detected)_

Only run this category if payment lib, cart routes, product schema, or checkout is detected.

## GA4 E-commerce Events _(only if GA4 detected)_

| ID  | Check                                                                                                                                             | P   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| L1  | `gtag('event', 'view_item'` or `dataLayer.push({ event: 'view_item'` missing on product pages                                                     | P1  |
| L2  | `gtag('event', 'add_to_cart'` missing in cart-add handler (not page load - double-counts on refresh)                                              | P1  |
| L3  | `gtag('event', 'begin_checkout'` missing on checkout entry                                                                                        | P1  |
| L4  | `gtag('event', 'purchase'` missing on order confirmation; `transaction_id` param absent or hardcoded (duplicate ID → inflated revenue on refresh) | P0  |
| L5  | Any of `view_item`/`add_to_cart`/`begin_checkout`/`purchase` missing `items: [` param → product reports empty                                     | P1  |
| L6  | `add_shipping_info`/`add_payment_info` missing in shipping/payment step components                                                                | P2  |

## Meta Pixel E-commerce Events _(only if Meta Pixel detected)_

| ID  | Check                                                                                                                                           | P   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| L7  | `fbq('track', 'ViewContent'` missing on product pages → no dynamic ads retargeting                                                              | P1  |
| L8  | `fbq('track', 'AddToCart'` missing or lacks `content_ids`, `value`, `currency`; fired on page load not button click                             | P1  |
| L9  | `fbq('track', 'InitiateCheckout'` missing on checkout entry                                                                                     | P1  |
| L10 | `fbq('track', 'Purchase'` missing on order confirmation; `value`/`currency` absent; `content_ids`/`contents` absent if using Advantage+ catalog | P0  |
| L11 | `fbq('track', 'AddPaymentInfo'` missing on payment step                                                                                         | P2  |

## General E-commerce

| ID  | Check                                                                                                                                      | P   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| L12 | Thank-you page fires `purchase`/`Purchase` unconditionally on load without dedup (session flag, one-time token, or server-side sent check) | P1  |
| L13 | No Meta CAPI (`/events` endpoint) or GA4 Measurement Protocol fallback - ad blockers suppress 30–60% of client-side events                 | P1  |
