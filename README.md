# Ulule Streaming Widgets (for StreamElements)

[Ulule](https://www.ulule.com/) provides widgets to display various page stats.

The following will list basic installation instructions, assuming you're already familiar with StreamElements and OBS (or a similar tool).

----

📖 ℹ️ If you need a detailed how-to or a list of supported events and interactions, please refer to **[the public documentation](https://ulule.notion.site/ulule-stream-widgets)** (only in French 🇫🇷 for now, sorry).

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

Here are the default available classes and IDs to override:

| Class/ID | Target |
|:---|:---|
| `.card` | Alert card container |
| `.logo` | The Ulule logo preceding the alert text |
| `#project` | The `span` displaying the project title |
| `#reward` | The `span` displaying the reward title |
| `#tip` | The `span` displaying the tip amount (when non-zero) |
| `#username` | The `span` displaying the public user name (or Anonymous) |

⚠️ You WILL need to use `!important`, otherwise the external style will take precedence.

For instance, to make the card opaque white instead of the default transluent black, add the following to the CSS tab on StreamElements:

```css
.card {
  background-color: white !important;
  border-radius: 4px !important;
  color: #232221 !important;
}
```

![white-ulule-progress-alert](https://github.com/user-attachments/assets/1c5cea61-fb84-4475-9a3a-edfb117a2064)


### Advanced testing with a custom event:

If you're already familiar with StreamElements Custom Widget development, you can send your own test events should you want to make sure the widget meets your needs.

This is an example of the `POST` payload expected by the widget:
```jsonc
{
  "event": "order",
  "data": {
    "currency": "€",
    "order_total": "15",
    "project": {
      "lang": "fr",
      "title": {
        "fr": "Un chouette projet"
      }
    },
    "rewards": [
      {
        "price": "10",
        "title": {
          "fr": "Contrepartie #1"
        }
      }
    ],
    "tip": "5",
    "user": {
      "user_name": "Jane Doe"
    }
  }
}
```

There are two different and possible payload types, depending on whether the project is a membership based one (i.e. a subscription-based page) or not.

**Details**

Here is a breakdown of the expected payload for **NON** membership-based projects:

| Field (path) | Type | Required | Description | Example |
|:---|:---|:---:|---|---|
| `event` | `string` | Yes | Event type. For now, only `order` is suppported. | `"order"` |
| `data` | `object` | Yes | Object containing order-specific details. | `{ … }` |
| `data.currency` | `string` | Yes | Currency symbol (e.g., €, $…). | `"€"` |
| `data.order_total` | `number` \| `string` | Yes | Total amount for the order. | `"33"` |
| `data.project` | `object` | Yes | Object containing project data. | `{ lang: "…", "title": { … } }` |
| `data.project.lang` | `string` | Yes | Default language for the project. Possible values are: `en`, `es`, `fr`, `it`, `nl` | `"fr"` |
| `data.project.title` | `object` | Yes | Project title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl` | `{ "en": "Project Title", "fr": "Titre du projet" }` |
| `data.rewards` | `array` | No | Array of rewards. | `[{ "title": "…" }, { "title": "…"}]` |
| `data.rewards[n].price` | `number` \| `string` | Yes | Amount paid for the reward. | `49.3` |
| `data.rewards[n].title` | `object` | Yes | Reward title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl` | `{ "en": "Deluxe Edition", "fr": "Édition Deluxe" }` |
| `data.user` | `object` | No | Object containing user data. | `{ user_name: "…" }`     |
| `data.user.user_name` | `string` | No | Backer's display name. If none, shows as anonymous. | `"Jane Doe"`     |
| `data.tip` | `number` \| `string` | No | Optional tip amount added to the order, expressed in the provided `data.currency`. | `"16"` |


Now, here is a breakdown of the expected payload for membership-based projects **ONLY**:

| Field (path) | Type | Required | Description | Example |
|:---|:---|:---:|---|---|
| `event` | `string` | Yes | Event type. For now, only `order` is suppported. | `"order"` |
| `data` | `object` | Yes | Object containing order-specific details. | `{ … }` |
| `data.currency` | `string` | Yes | Currency symbol (e.g., €, $…). | `"€"` |
| `data.is_recurring` | `boolean` | Yes | Whether this subscription is a rewardless recurring donation (when `true`) or a standard reward-based sub (when `false`). | `false` |
| `data.order_total` | `number` \| `string` | Yes | Total amount for the order. | `"44"` |
| `data.project` | `object` | Yes | Object containing project data. | `{ lang: "…", "title": { … } }` |
| `data.project.lang` | `string` | Yes | Default language for the project. Possible values are: `en`, `es`, `fr`, `it`, `nl` | `"fr"` |
| `data.project.title` | `object` | Yes | Project title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl` | `{ "en": "Project Title", "fr": "Titre du projet" }` |
| `data.subscription` | `object` | Yes | Object containing subscription data. | `"{ "reward": { … } }"` |
| `data.subscription.months` | `number` | Yes | Subscription tenure in months, which is total months % 12 to account for full years (can be 0). | `7` |
| `data.subscription.reward` | `object` | Yes | Object containing reward data. | `[{ "title": "…" }, { "title": "…"}]` |
| `data.subscription.reward.price` | `number` \| `string` | No | Amount paid for the reward (none if free tier). | `"7"` |
| `data.subscription.reward.title` | `object` | Yes | Reward title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl` | `{ "en": "Tier 1", "fr": "Niveau 1" }` |
| `data.subscription.total` | `number` \| `string` | No | Total amount for the subscription. If `is_recurring: true`, then this is the donation amount. | `"21"` |
| `data.subscription.years` | `number` | Yes | Subscription tenure in years (can be 0). | `1` |
| `data.user` | `object` | No | Object containing user data. | `{ user_name: "…" }`     |
| `data.user.user_name` | `string` | No | Subscriber's display name. If none, shows as anonymous. | `"John Doe"`     |
| `data.tip` | `number` \| `string` | No | Optional one-time (i.e. NOT recurring) tip amount added to the order, expressed in the provided `data.currency`. | `"16"` |

Bear in mind that the payload needs to be sent to:

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
