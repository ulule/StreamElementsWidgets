# Ulule Streaming Widgets (for StreamElements)

[Ulule](https://www.ulule.com/) provides widgets to display various page stats.

The following will list basic installation instructions, assuming you're already familiar with StreamElements and OBS (or a similar tool).

---

📖 ℹ️ If you need a detailed how-to or a list of supported events and interactions, please refer to **[the public documentation](https://ulule.notion.site/ulule-stream-widgets)** (only in French 🇫🇷 for now, sorry).

---

## Alert widget

![Ulule Alert Widget](https://github.com/user-attachments/assets/8a6cee26-a608-4857-b155-24c198c02437)

### Steps:

- Create a new Overlay in your StreamElements dashboard, and make it host a Custom Widget
- Copy and paste the provided code into the **HTML** tab of the new widget:
  https://github.com/ulule/StreamElementsWidgets/blob/main/src/alert/index.html
- Copy and paste the provided configuration into the **Fields** tab of the new widget:
  https://github.com/ulule/StreamElementsWidgets/blob/main/src/alert/fields.json
- Save the newly created overlay
- Share your StreamElements Account ID and JWT Token with your coach at Ulule to finish activating the widget

⚠️ If you were using the widget prior to August 2026, you must copy the new `index.html` content into your StreamElements **HTML** tab AND the new `fields.json` content into your **Fields** tab. Older installs still load the previous direct socket script and will not receive the new broadcast events correctly. The external HTML/JS cannot save those fields automatically.

August 2026 update note:

- You can now configure the alert display duration.
- You can now test the alert using a button in the Notification settings.

### Advanced configuration:

The Fields tab exposes the supported visual options: font, text color, highlighted text color, block color, block opacity, block radius, optional notification sound, and optional free-tier membership alerts.

Use the Fields tab for visual customization. It is the supported setup path, and it is the only configuration path documented here.

### Advanced testing with a custom event:

If you're already familiar with StreamElements Custom Widget development, you can send your own test events should you want to make sure the widget meets your needs.

This is an example of the Ulule event handled by the widget. The `testing/send-alert-event.mjs` script accepts this shape and wraps it in the StreamElements broadcast envelope shown below:

```json
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

| Field (path)            | Type                 | Required | Description                                                                           | Example                                              |
| :---------------------- | :------------------- | :------: | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `event`                 | `string`             |   Yes    | Event type. For now, only `order` is supported.                                       | `"order"`                                            |
| `data`                  | `object`             |   Yes    | Object containing order-specific details.                                             | `{ … }`                                              |
| `data.currency`         | `string`             |   Yes    | Currency symbol (e.g., €, $…).                                                        | `"€"`                                                |
| `data.order_total`      | `number` \| `string` |   Yes    | Total amount for the order.                                                           | `"33"`                                               |
| `data.project`          | `object`             |   Yes    | Object containing project data.                                                       | `{ lang: "…", "title": { … } }`                      |
| `data.project.lang`     | `string`             |   Yes    | Default language for the project. Possible values are: `en`, `es`, `fr`, `it`, `nl`   | `"fr"`                                               |
| `data.project.title`    | `object`             |   Yes    | Project title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl` | `{ "en": "Project Title", "fr": "Titre du projet" }` |
| `data.rewards`          | `array`              |    No    | Array of rewards.                                                                     | `[{ "title": "…" }, { "title": "…"}]`                |
| `data.rewards[n].price` | `number` \| `string` |   Yes    | Amount paid for the reward.                                                           | `49.3`                                               |
| `data.rewards[n].title` | `object`             |   Yes    | Reward title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl`  | `{ "en": "Deluxe Edition", "fr": "Édition Deluxe" }` |
| `data.user`             | `object`             |    No    | Object containing user data.                                                          | `{ user_name: "…" }`                                 |
| `data.user.user_name`   | `string`             |    No    | Backer's display name. If none, shows as anonymous.                                   | `"Jane Doe"`                                         |
| `data.tip`              | `number` \| `string` |    No    | Optional tip amount added to the order, expressed in the provided `data.currency`.    | `"16"`                                               |

Now, here is a breakdown of the expected payload for membership-based projects **ONLY**:

| Field (path)                     | Type                 | Required | Description                                                                                                                        | Example                                              |
| :------------------------------- | :------------------- | :------: | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `event`                          | `string`             |   Yes    | Event type. For now, only `order` is supported.                                                                                    | `"order"`                                            |
| `data`                           | `object`             |   Yes    | Object containing order-specific details.                                                                                          | `{ … }`                                              |
| `data.currency`                  | `string`             |   Yes    | Currency symbol (e.g., €, $…).                                                                                                     | `"€"`                                                |
| `data.order_total`               | `number` \| `string` |   Yes    | Total amount for the order.                                                                                                        | `"44"`                                               |
| `data.project`                   | `object`             |   Yes    | Object containing project data.                                                                                                    | `{ lang: "…", "title": { … } }`                      |
| `data.project.lang`              | `string`             |   Yes    | Default language for the project. Possible values are: `en`, `es`, `fr`, `it`, `nl`                                                | `"fr"`                                               |
| `data.project.title`             | `object`             |   Yes    | Project title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl`                                              | `{ "en": "Project Title", "fr": "Titre du projet" }` |
| `data.subscription`              | `object`             |   Yes    | Object containing subscription data.                                                                                               | `{ "reward": { … } }`                                |
| `data.subscription.is_recurring` | `boolean`            |   Yes    | Whether this subscription is a rewardless recurring donation (when `true`) or a standard reward-based subscription (when `false`). | `false`                                              |
| `data.subscription.months`       | `number`             |   Yes    | Subscription tenure in months, which is total months % 12 to account for full years (can be 0).                                    | `7`                                                  |
| `data.subscription.reward`       | `object` \| `null`   |    No    | Object containing reward data. Empty for rewardless recurring donations.                                                           | `{ "title": { … } }`                                 |
| `data.subscription.reward.price` | `number` \| `string` |    No    | Amount paid for the reward (none if free tier).                                                                                    | `"7"`                                                |
| `data.subscription.reward.title` | `object`             |    No    | Reward title in available languages. Possible keys are: `en`, `es`, `fr`, `it`, `nl`                                               | `{ "en": "Tier 1", "fr": "Niveau 1" }`               |
| `data.subscription.total`        | `number` \| `string` |    No    | Total amount for the subscription. If `data.subscription.is_recurring` is `true`, then this is the donation amount.                | `"21"`                                               |
| `data.subscription.years`        | `number`             |   Yes    | Subscription tenure in years (can be 0).                                                                                           | `1`                                                  |
| `data.user`                      | `object`             |    No    | Object containing user data.                                                                                                       | `{ user_name: "…" }`                                 |
| `data.user.user_name`            | `string`             |    No    | Subscriber's display name. If none, shows as anonymous.                                                                            | `"John Doe"`                                         |
| `data.tip`                       | `number` \| `string` |    No    | Optional one-time (i.e. NOT recurring) tip amount added to the order, expressed in the provided `data.currency`.                   | `"16"`                                               |

Bear in mind that the payload needs to be sent to:

```
https://api.streamelements.com/kappa/v2/overlays/[account-id]/broadcast
```

… while properly replacing `[account-id]`, providing the StreamElements JWT Token, and wrapping the event as:

```json
{
  "target": "global",
  "event": "order",
  "data": {}
}
```

Two different identifiers can be involved:

| Location                                    | Value                               | Usage                                                                                      |
| :------------------------------------------ | :---------------------------------- | :----------------------------------------------------------------------------------------- |
| URL path `/overlays/[account-id]/broadcast` | StreamElements account/channel ID   | Required by the broadcast endpoint. This is **not** the individual overlay ID.             |
| Body field `"target"`                       | `"global"` or a specific overlay ID | `"global"` sends to every overlay for the account. An overlay ID targets one overlay only. |

In the Ulule project backoffice, the StreamElements Account ID is stored separately from the optional overlay target. If no overlay target is configured, Ulule sends `"target": "global"`.

For external testing, use the same Account ID and JWT token stored on the project:

```sh
export STREAMELEMENTS_ACCOUNT_ID="your-account-id"
export STREAMELEMENTS_JWT="your-jwt-token"
# Optional: target one overlay instead of every overlay in the account.
export STREAMELEMENTS_OVERLAY_ID="your-overlay-id"

node testing/send-alert-event.mjs testing/alert-events/reward-with-tip.json
node testing/send-alert-event.mjs testing/alert-events/multi-reward.json
node testing/send-alert-event.mjs testing/alert-events/donation-only-anonymous.json
node testing/send-alert-event.mjs testing/alert-events/paid-membership.json
node testing/send-alert-event.mjs testing/alert-events/membership-tip.json
node testing/send-alert-event.mjs testing/alert-events/free-tier-membership.json
node testing/send-alert-event.mjs testing/alert-events/recurring-donation.json
```

Keep the StreamElements overlay preview open while sending the events. For `free-tier-membership.json`, the default expected result is no alert; enable `Alerte lors d'un abonnement gratuit` in the widget fields to test the visible alert.

## Progress widget

![Ulule Progress Widget](https://github.com/user-attachments/assets/75bacd91-9ffd-47fa-bb23-450148ea1523)

### Steps:

- Create a new Overlay in your StreamElements dashboard, and make it host a Custom Widget.
- Copy and paste the provided code into the **HTML** tab of the new widget:
  https://github.com/ulule/StreamElementsWidgets/blob/main/src/progress/index.html
- Copy and paste the provided configuration into the **Fields** tab of the new widget:
  https://github.com/ulule/StreamElementsWidgets/blob/main/src/progress/fields.json
- Save the newly created overlay
- Open your Ulule project backoffice and grab your numerical project ID from the URL
- Go back to the StreamElements widget and set the project ID in the widget fields
- Set the other field parameters to your liking

⚠️ If you were using the widget prior to July 2026, you must copy the new `index.html` content into your StreamElements **HTML** tab AND the new `fields.json` content into your **Fields** tab. The redesigned widget needs the new HTML structure and field names to render correctly.

### Advanced configuration:

The Progress widget uses the project `stats.json` file for the current value, goal, and optional next stage goal. If needed, the widget suffix (e.g. "€", "abonné·es", etc.) can be configured manually and freely in StreamElements.

Main fields:

| Field                                         | Usage                                                                                      |
| :-------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `Identifiant numérique du projet`             | Ulule project ID, visible within the backoffice URL                                        |
| `Intervalle de rechargement (secondes)`       | Refresh frequency for project statistics; defaults to 20 seconds                           |
| `Afficher le prochain palier`                 | Uses `next_stage_goal` when available and shows `Prochain palier : ...`                    |
| `Suffixe`                                     | Display suffix, for example `€`, `préventes`, or `abonné·es`; leave empty for no suffix    |
| `Afficher le suffixe sur le montant collecté` | Keep enabled for financial goals. Disable it for displays like `50 704 / 50 000 préventes` |
| Text, block, and progress fields              | Visual customization for the block, amount row, track, fill, and percentage                |

#### July 2026 update note:

`Pourcentage cible` has been removed. The progress bar now targets the next available stage when `Afficher le prochain palier` is enabled and Ulule exposes one; otherwise it targets the project goal. Existing StreamElements values stored for `targetPercentage` are ignored by this version.

### Dashboard testing:

The Progress widget reads `https://data.ulule.com/projects/[project-id]/stats.json`, so arbitrary local files will not affect a StreamElements dashboard widget by themselves.

For quick dashboard testing, temporarily paste the content of `testing/progress-mock-fetch-snippet.html` before the Progress widget script in the HTML tab. Then edit `window.ULULE_PROGRESS_MOCK_STATS` with one of the examples from `testing/progress-stats/`.

Remove the mock snippet before publishing the widget.

## Automated tests

Run the dependency-free widget regression suite from the repository root:

```sh
npm test
```

The suite covers all alert fixtures, event-data escaping, free-tier behavior, Progress calculations, legacy suffix compatibility, field defaults, and editor errors.
