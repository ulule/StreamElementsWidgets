CURRENT_LOCALE = 'fr'
ENABLE_PROJECT_NAME = true
ENABLE_FREE_TIER = false

window.addEventListener('onWidgetLoad', async (obj) => {
  const apiToken = obj.detail.channel.apiToken

  const socket = io('https://realtime.streamelements.com', {
    transports: ['websocket'],
  })
  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('authenticated', onAuthenticated)
  socket.on('unauthorized', console.error)

  function showElement(newElement) {
    const wrapper = document.getElementById('ulule-widget-container')
    wrapper?.append(newElement)

    setTimeout(() => {
      newElement.remove()
    }, '5000')
  }

  function logo() {
    const logo = document.createElement('div')
    logo.innerHTML = `<div class="logo"></div>`
    return logo.outerHTML
  }

  socket.on('order', (data) => {
    const cardElement = document.createElement('div')

    const { currency, user, rewards, subscription } = data

    const tip = Number(data.tip)
    const tipLabel = tip && tip > 0 ? ` + un don de <span id="tip">${tip} ${currency}</span>` : ''
    const userName = user.user_name ?? 'une personne anonyme'

    // Membership-based project
    if (subscription) {
      const { project } = data
      const { is_recurring: isRecurring, months, total, years } = subscription

      const projectLabel = ENABLE_PROJECT_NAME ? `à <span id="project">${getI18n(project.title)}</span>` : ''
      const subscriptionTitle = getI18n(subscription.reward.title)
      const tipLabel = `<p>Merci <span id="username">${userName}</span> pour le don de <span id="tip">${tip} ${currency}</span> ${projectLabel} !`
      const yearsLabel = getYearsLabel(years)

      // Recurring donation to a membership-based project
      if (isRecurring && total > 0) {
        cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>Merci <span id="username">${userName}</span> pour le don mensuel de <span id="tip">${total} ${currency}</span> ${projectLabel} !</p>
        </div>`
      }
      else {
        // Running membership, no tip
        if (years > 0 && months > 0) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour les ${yearsLabel} et ${months} mois d'abonnement au niveau <span id="reward">"${subscriptionTitle}"</span> !</p>
          </div>`
        } else if (years > 0) {
          cardElement.innerHTML = ` 
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour les ${yearsLabel} d'abonnement au niveau <span id="reward">"${subscriptionTitle}"</span> !</p>
          </div>`
        }
        else if (months > 0) {
          cardElement.innerHTML = ` 
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour les ${months} mois d'abonnement au niveau <span id="reward">"${subscriptionTitle}"</span> !</p>
          </div>`
        } else if (subscription.reward) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour le nouvel abonnement ${projectLabel} au niveau <span id="reward">"${subscriptionTitle}"</span> !</p>
          </div>`
        } else if (ENABLE_FREE_TIER) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour le nouvel abonnement gratuit !</p>
          </div>`
        }
      }

      // Tip on top of a running membership
      if (tip && subscriptionTitle) {
        // Membership older than a year
        if (years > 0 && months > 0) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
             ${tipLabel} Abonné·e au niveau <span id="reward">"${subscriptionTitle}"</span> depuis ${yearsLabel} et ${months} mois</p>
          </div>`
        }
        else if (years > 0) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
             ${tipLabel} Abonné·e au niveau <span id="reward">"${subscriptionTitle}"</span> depuis ${yearsLabel}</p>
          </div>`
        }
        // Membership of less than a year
        else if (months > 0) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            ${tipLabel} Abonné·e au niveau <span id="reward">"${subscriptionTitle}"</span> depuis ${months} mois</p>
          </div>`
          // New membership
        } else {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            ${tipLabel} Abonné·e au niveau <span id="reward">"${subscriptionTitle}"</span></p>
          </div>`
        }

      }

      return showElement(cardElement)
    }

    // Order with a tip only (no reward)
    if (rewards === null || rewards.length === 0) {
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>Merci <span id="username">${capitalize(userName)}</span> pour le don de <span id="tip">${tip} ${currency}</span> !</p>
        </div>`
    } else if (rewards.length === 1) {
      // Order with a single reward
      const reward = rewards[0]
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p><span id="username">${capitalize(userName)}</span> vient de choisir la contrepartie <span id="reward">« ${getI18n(reward.title)} »</span> ${tipLabel} !</p>
        </div>`
    } else {
      // Order with multiple rewards
      const titles = rewards.map((reward) => {
        return `<span id="reward">« ${getI18n(reward.title)} »</span>`
      })
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p><span id="username">${capitalize(userName)}</span> vient de choisir les contreparties ${titles.join(', ')} ${tipLabel} !</p>
        </div>`
    }

    showElement(cardElement)
  })

  function onConnect() {
    console.log('[ulule-widget] Successfully connected to the websocket')
    socket.emit('authenticate', { method: 'apikey', token: apiToken })
  }

  function onDisconnect() {
    console.log('[ulule-widget] Lost connection to the websocket')
    console.log('[ulule-widget] Reconnecting…')
    onConnect()
  }

  function onAuthenticated(data) {
    console.log(`[ulule-widget] Successfully connected to channel ${data.channelId}`)
  }

  // IN-HOUSE HELPERS

  /**
   * Capitalizes the first character of a given string.
   *
   * This function takes any input, converts it to a string, and returns a new
   * string where the first character is transformed to uppercase. If the input is
   * falsy (e.g., null, undefined, empty string, 0, false), it returns an empty
   * string.
   *
   * @param {*} s - The value to capitalize. It will be converted to a string.
   * @returns {string} - The string with its first character capitalized, or an empty
   *                     string if the input is falsy.
   */
  function capitalize(s) {
    return (s && String(s[0]).toUpperCase() + String(s).slice(1)) || ""
  }

  /**
   * Retrieves the best-matched localized string from an i18n resource object.
   *
   * The function attempts to return:
   * 1. The value for the current locale (via `CURRENT_LOCALE`), if present.
   * 2. Otherwise, the English (`"en"`) value, if present.
   * 3. Otherwise, the first available value in the resource object.
   *
   * @param {Object.<string, string>} resource
   *   An object mapping locale codes (e.g., `"en"`, `"fr"`, `"es"`) to localized strings.
   *
   * @returns {string}
   *   The localized string that best matches the current locale fallback rules.
   */
  function getI18n(resource) {
    if (resource[CURRENT_LOCALE]) {
      return resource[CURRENT_LOCALE]
    }

    if (resource['en']) {
      return resource['en']
    }

    return Object.values(resource)[0]
  }


  /**
   * Returns a label for a given number of years.
   *
   * This function converts a numeric value representing years into a properly
   * formatted string in French. It handles the singular and plural forms:
   * - "1 an" for exactly 1 year
   * - "{n} ans" for any other positive number of years
   *
   * @param {number} years - The number of years to convert.
   * @returns {string|undefined} - The formatted French label for the years.
   *                               Returns `undefined` if the input is 0 or negative.
   *
   * @example
   * getYearsLabel(1); // Returns "1 an"
   * getYearsLabel(3); // Returns "3 ans"
   * getYearsLabel(0); // Returns undefined
   */
  function getYearsLabel(years) {
    if (years === 1) {
      return "1 an"
    }

    if (years > 0) {
      return `${years} ans`
    }
  }
})
