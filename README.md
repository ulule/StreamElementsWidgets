# Ulule Streaming Widgets (for StreamElements)

[Ulule](https://www.ulule.com/) provides widgets to display various page stats.

The following will list basic installation instructions, assuming you're already familiar with StreamElements and OBS (or a similar tool).

----

📖 ℹ️ If you need a detailed how-to, a preview or a list of supported events and interactions, please refer to **[the public documentation](https://ulule.notion.site/ulule-stream-widgets)** (only in French 🇫🇷 for now, sorry).

----
## Alert widget

![Ulule Alert Widget](https://github.com/user-attachments/assets/8a6cee26-a608-4857-b155-24c198c02437)

### Steps:

- Create a new Overlay in your StreamElements dashboard, and make it host a Custom Widget
- Copy and paste the provided code into the HTML tab of the new widget:
https://github.com/ulule/StreamElementsWidgets/blob/907dcc46029687579d715ed2f3ad5e4d54985cd3/src/alert/index.html#L1-L11
- Save the newly created overlay
- Share your StreamElements Account ID and JWT Token with your coach at Ulule to finish activating the widget

### Advanced configuration:

Feel free to implement custom CSS code within the StreamElements CSS tab to make the widget suit your liking!

### Advanced testing with a custom event:

If you're already familiar with StreamElements Custom Widget development, you can send your own test events should you want to make sure the widget meets your needs.

This is an exemple of the `POST` payload expected by the widget:
```jsonc
{
    "event": "sub",
    "data": {
        "currency": "€",
        "months": 1,
        "tip": "20", // Optional
        "subName": "Tier 1",
        "userName": "Jane Doe",
        "years": 3,
    }
}
```

There are two different and possible payload types, dependending on the `event` value provided: `contribution` or `sub`.

**Details**

`contribution`-type event:
| Field (path) | Type | Required | Description | Example |
|:---|:---|:---:|---|---|
| `event` | `"contribution"` | Yes | Event type. Use `contribution` for reward-based fundraisers. | `"contribution"` |
| `data` | `object` | Yes | Object containing order-specific details. | `{ ... }` |
| `data.currency` | `string` | Yes | Currency symbol (e.g., €, $…). | `"€"` |
| `data.rewardName` | `string` | Yes | Reward title. | `"Ultra Deluxe Edition"` |
| `data.userName` | `string` | No (optional) | Backer's display name. If none, show as anonymous. | `"Jane Doe"`     |
| `data.tip` | `number` or `string` | No (optional) | Optional tip amount added to the order, expressed in the provided `data.currency`. | `"5"` |

`sub`-type event:
| Field (path) | Type | Required | Description | Example |
|:---|:---|:---:|---|---|
| `event` | `"sub"` | Yes | Event type. Use `sub` for memberships. | `"sub"` |
| `data` | `object` | Yes | Object containing order-specific details. | `{ ... }` |
| `data.currency` | `string` | Yes | Currency symbol (e.g., €, $…). | `"€"` |
| `data.isRecurringDonation` | `boolean` | Yes | Whether is it a recurring donation or a straight subscription. | `true` |
| `data.months` | `integer` | Yes | Subscription tenure in months, which is total months % 12 to account for full years (can be 0). | `1` |
| `data.recurringDonationAmount` | `number` | No (optional) | Optional recurring donation amount, expressed in the provided `data.currency`. | `20` |
| `data.subName` | `string` | Yes | Subscription title. | `"Tier 1"` |
| `data.tip` | `number` | No (optional) | Optional tip amount added to the order, expressed in the provided `data.currency`. | `20` |
| `data.userName` | `string` | Yes | Subscriber's display name. | `"John Doe"` |
| `data.years` | `integer` | Yes | Subscription tenure in years (can be 0). | `3` |

Bear in mind that the payload needs to be send to:

```
https://api.streamelements.com/kappa/v2/channels/[account-id]/socket
```

… while properly replacing `[account-id]` and providing the StreamElements JWT Token.

## Progress widget

![Ulule Progress Widget](https://github.com/user-attachments/assets/75bacd91-9ffd-47fa-bb23-450148ea1523)

### Steps:

- Create a new Overlay in your StreamElements dashboard, and make it host a Custom Widget.
- Copy and paste the provided code into the new widget:
  - **HTML tab**
  https://github.com/ulule/StreamElementsWidgets/blob/48aff9e056f1bd731216318a15db2a16562c29e9/src/progress/index.html#L1-L8
  - **Fields tab**
  https://github.com/ulule/StreamElementsWidgets/blob/48aff9e056f1bd731216318a15db2a16562c29e9/src/progress/fields.json#L1-L79
- Save and reload
- Open up your Ulule project backoffice and grab your numerical project ID from the URL
- Go back to the StreamElements freshly created widget, set the project ID on the left sidebar
- Set the other sidebar parameters to your liking and enjoy!

### Advanced configuration:

Feel free to implement custom CSS code within the StreamElements CSS tab to make the widget suit your liking. And if needed, you can also edit the fields to your liking through the dedicated tab!
