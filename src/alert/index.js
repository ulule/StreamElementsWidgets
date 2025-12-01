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

  socket.on('orders', (data) => {
    const cardElement = document.createElement('div')

    const { currency, user, rewards } = data
    const userName = user.user_name ?? 'Une personne anonyme'

    const tip = Number(data.tip)
    const tipLabel = tip && tip > 0 ? ` + un don de <span id="tip">${tip} ${currency}</span>` : ''

    // Order with a tip only (no reward)
    if (rewards === null || rewards.length === 0) {
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>Merci <span id="username">${userName}</span> pour le don de <span id="tip">${tip} ${currency}</span> !</p>
        </div>`
    } else if (rewards.length === 1) {
      // Order with a single reward
      const reward = rewards[0]
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p><span id="username">${userName}</span> vient de choisir la contrepartie <span id="subname">« ${getI18n(reward.title)} »</span> ${tipLabel} !</p>
        </div>`
    } else {
      // Order with multiple rewards
      const titles = rewards.map((reward) => {
        return `<span id="subname">« ${getI18n(reward.title)} »</span>`
      })
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p><span id="username">${userName}</span> vient de choisir les contreparties ${titles.join(', ')} ${tipLabel} !</p>
        </div>`
    }

    showElement(cardElement)
  })

  socket.on('subscriptions', (data) => {
    const cardElement = document.createElement('div')

    const { currency, is_recurring: isRecurring, months, project, reward, total, tip, user, years } = data
    const userName = user.user_name ?? 'Une personne anonyme'
    const rewardTitle = getI18n(reward.title)

    const projectLabel = ENABLE_PROJECT_NAME ? `à <span id="project">${getI18n(project.title)}</span>` : ''
    const tipLabel = `<p>Merci <span id="username">${userName}</span> pour le don de <span id="tip">${tip} ${currency}</span> ${projectLabel} !`


    // Recurring donation to a membership-based project
    if (isRecurring && total > 0) {
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>Merci <span id="username">${userName}</span> pour le don mensuel de <span id="tip">${total} ${currency}</span> ${projectLabel} !</p>
        </div>`
    }
    // Membership with a tip
    else if (tip) {
      // Running membership
      if (rewardTitle) {
        // Membership older than a year
        if (years !== 0 && years !== 'null' && years !== '0' && years !== undefined) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
             ${tipLabel} Abonné·e au niveau <span id="subname">"${rewardTitle}"</span> depuis ${years} an(s) et ${months} mois</p>
          </div>`
        // Membership of less than a year
        } else if (months !== 0 && months !== 'null' && months !== '0' && months !== undefined) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            ${tipLabel} Abonné·e au niveau <span id="subname">"${rewardTitle}"</span> depuis ${months} mois</p>
          </div>`
        // New membership
        } else {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            ${tipLabel} Abonné·e au niveau <span id="subname">"${rewardTitle}"</span></p>
          </div>`
        }
      }
    } else {
      // Running membership, no tip
      if (years !== 0 && years !== 'null' && years !== '0' && years !== undefined) {
        cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour les ${years} an(s) et ${months} mois d'abonnement au niveau <span id="subname">"${rewardTitle}"</span> !</p>
          </div>`
      } else if (months !== 0 && months !== 'null' && months !== '0' && months !== undefined) {
        cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour les ${months} mois d'abonnement au niveau <span id="subname">"${rewardTitle}"</span> !</p>
          </div>`
      } else if (reward) {
        cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour le nouvel abonnement ${projectLabel} au niveau <span id="subname">"${rewardTitle}"</span> !</p>
          </div>`
      } else if (ENABLE_FREE_TIER) {
        cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${userName}</span> pour le nouvel abonnement gratuit !</p>
          </div>`
      }
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
})