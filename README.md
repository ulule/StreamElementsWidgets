# Ulule Streaming Widgets (for StreamElements)

[Ulule](https://www.ulule.com/) provides widgets to display various page stats.

The following will list basic installation instructions, assuming you're already familiar with StreamElements and OBS (or a similar tool).

----

📖 ℹ️ If you need a detailed how-to, a preview or a list of supported events and interactions, please refer to **[the public documentation](https://ulule.notion.site/ulule-stream-widgets)** (only in French 🇫🇷 for now, sorry).

----
## Alert widget

![Screen Recording 2025-07-03 at 11 45 02](https://github.com/user-attachments/assets/8a6cee26-a608-4857-b155-24c198c02437)

### Steps:

- Create a new overlay in your StreamElements dashboard, and make it host a Custom Widget
- Copy and paste the provided code into the HTML tab of the new widget:
https://github.com/ulule/StreamElementsWidgets/blob/38ee448a7235ba861008fbda8c983fb70b92bfe5/src/alert/index.html#L1-L11
- Save the newly created overlay
- Share your StreamElements Account ID and JWT Token with your coach at Ulule to finish activating the widget

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
| `data.userName` | `string` | No (optional) | Backer's display name. | `"Jane Doe"`     |
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

### Steps:

- Create a new custom widget in your StreamElements dashboard.
- Copy and paste the provided code into the new widget.
- Make sure to link your StreamElements ID in your backoffice to receive the events.

The code below has everything you need to get the widget up and running:

**HTML :**

```
<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet">
<link rel="stylesheet" href='https://cdn.jsdelivr.net/gh/ulule/StreamElementsWidgets@main/src/progress/index.css' />

<script src="https://cdn.socket.io/4.7.5/socket.io.min.js" integrity="sha384-2huaZvOR9iDzHqslqwpR87isEmrfxqyWOF7hr7BY6KG0+hVKLoEXMPUJw3ynWuhO" crossorigin="anonymous"></script>
<script src='https://cdn.jsdelivr.net/gh/ulule/StreamElementsWidgets@main/src/progress/index.js' crossorigin="anonymous"></script>

<div class="amount"></div>
  <div class="progress-bar">
    <span class="progress-bar__content"></span>
  </div>
<div class="stretch-goal"></div>
```

**FIELDS :**

```
{
  "projectNumericalId": {
    "label": "Identifiant numérique du projet",
    "type": "number"
  },
  "refreshInterval": {
    "label": "Intervalle de rechargement (secondes)",
    "min": 5,
    "step": 1,
    "type": "number",
    "value": 30
  },
  "currency": {
    "label": "Devise",
    "type": "text",
    "value": "€"
  },
  "presaleSuffix": {
    "label": "Suffixe des préventes",
    "type": "text",
    "value": "préventes"
  },
  "fontColor": {
    "label": "Couleur du texte (collecté)",
    "type": "colorpicker",
    "value": "#ffffff"
  },
  "fontFamily": {
    "label": "Police",
    "type": "text",
    "value": "Oxanium"
  },
  "fontSize": {
    "label": "Taille du texte (collecté)",
    "step": 1,
    "type": "number",
    "value": 16
  },
  "targetPercentage": {
    "label": "Pourcentage cible",
    "min": 100,
    "step": 1,
    "type": "number",
    "value": 100
  },
  "progressBackgroundColor": {
    "label": "Couleur de fond de la progression",
    "type": "colorpicker",
    "value": "transparent"
  },
  "progressBarColor": {
    "label": "Couleur de la barre de progression",
    "type": "colorpicker",
    "value": "#02715c"
  },
  "progressBorderColor": {
    "label": "Couleur de bordure de la progression",
    "type": "colorpicker",
    "value": "#02715c"
  },
  "progressBorderRadius": {
    "label": "Courbure de la bordure de progression",
    "min": 0,
    "step": 1,
    "type": "number",
    "value": 4
  },
  "progressBarFontColor": {
    "label": "Couleur du texte de progression",
    "type": "colorpicker",
    "value": "#ffffff"
  },
  "progressBarFontSize": {
    "label": "Taille du texte de progression",
    "step": 1,
    "type": "number",
    "value": 14
  }
}
```

And don't forget to add your projet id to the new custom field on the left sidebar !
