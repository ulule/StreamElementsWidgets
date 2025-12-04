CURRENT_LOCALE = 'fr'
ENABLE_PROJECT_NAME = true
ENABLE_FREE_TIER = false

window.addEventListener('onWidgetLoad', async (obj) => {
  const apiToken = obj.detail.channel.apiToken

  const socket = io('https://realtime.streamelements.com', {
    transports: ['websocket'],
  })
  socket.on('authenticated', onAuthenticated)
  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('order', handleOrder)
  socket.on('unauthorized', console.error)

  // SOCKET HANDLERS

  function onAuthenticated(data) {
    console.log(`[ulule-widget] Successfully connected to channel ${data.channelId}`)
  }

  function onConnect() {
    console.log('[ulule-widget] Successfully connected to the websocket')
    socket.emit('authenticate', { method: 'apikey', token: apiToken })
  }

  function onDisconnect() {
    console.log('[ulule-widget] Lost connection to the websocket')
    console.log('[ulule-widget] Reconnecting…')
    onConnect()
  }

  // ORDER HANDLERS

  function handleOrder(data) {
    const { subscription, user } = data
    const tip = Number(data.tip)
    const userName = user.user_name ?? 'une personne anonyme'

    if (subscription) {
      return handleSubscriptionOrder(data, tip, userName)
    }

    return handleRegularOrder(data, tip, userName)
  }

  function handleRegularOrder(data, tip, userName) {
    const { currency, rewards } = data
    const tipLabel = tip && tip > 0 ? ` + un don de <span id="tip">${tip} ${currency}</span>` : ''
    let message = null

    // Tip only (no reward)
    if (!rewards || rewards.length === 0) {
      message = `Merci <span id="username">${capitalize(userName)}</span> pour le don de <span id="tip">${tip} ${currency}</span> !`
    }
    // Single reward
    else if (rewards.length === 1) {
      const reward = rewards[0]
      message = `<span id="username">${capitalize(userName)}</span> vient de choisir la contrepartie <span id="reward">« ${getI18n(reward.title)} »</span> ${tipLabel} !`
    }
    // Multiple rewards
    else {
      const titles = rewards.map((reward) => `<span id="reward">« ${getI18n(reward.title)} »</span>`)
      message = `<span id="username">${capitalize(userName)}</span> vient de choisir les contreparties ${titles.join(', ')} ${tipLabel} !`
    }

    showCard(message)
  }

  function handleSubscriptionOrder(data, tip, userName) {
    const { currency, project, subscription } = data
    const { is_recurring: isRecurring, months, total, years } = subscription
    const subscriptionTitle = subscription.reward.title && getI18n(subscription.reward.title)

    const projectLabel = ENABLE_PROJECT_NAME ? `à <span id="project">${getI18n(project.title)}</span>` : ''
    const durationLabel = getDurationLabel(years, months)

    let message = null

    // Recurring donation to membership-based project
    if ((isRecurring && total > 0) || (!isRecurring && total > 0 && !subscription.reward.title)) {
      message = buildRecurringDonationMessage(userName, total, currency, durationLabel, projectLabel)
    }
    // Running membership with reward (no tip)
    else if (subscriptionTitle) {
      message = buildMembershipMessage(userName, subscriptionTitle, durationLabel, years, months, projectLabel)
    }
    // Free tier membership
    else if (ENABLE_FREE_TIER) {
      message = `Merci <span id="username">${userName}</span> pour le nouvel abonnement gratuit !`
    }

    // Tip on top of existing membership
    if (tip && subscriptionTitle) {
      message = buildMembershipTipMessage(userName, tip, currency, subscriptionTitle, durationLabel, projectLabel)
    }

    if (message) {
      showCard(message)
    }

    console.warn('[ulule-widget] No subscription message could be formed', data)
  }

  // MESSAGE BUILDERS

  function buildMembershipMessage(userName, subscriptionTitle, durationLabel, years, months, projectLabel) {
    // New membership
    if (years === 0 && months === 0) {
      return `Merci <span id="username">${userName}</span> pour le nouvel abonnement ${projectLabel} au niveau <span id="reward">« ${subscriptionTitle} »</span> !`
    }

    // Existing membership
    return `Merci <span id="username">${userName}</span> pour les ${durationLabel} d'abonnement au niveau <span id="reward">« ${subscriptionTitle} »</span> !`
  }

  function buildMembershipTipMessage(userName, tip, currency, subscriptionTitle, durationLabel, projectLabel) {
    const tipLabel = `Merci <span id="username">${userName}</span> pour le don de <span id="tip">${tip} ${currency}</span> ${projectLabel} !`

    if (!durationLabel) {
      return `${tipLabel} Abonné·e au niveau <span id="reward">« ${subscriptionTitle} »</span></p>`
    }

    return `${tipLabel} Abonné·e au niveau <span id="reward">« ${subscriptionTitle} »</span> depuis ${durationLabel}</p>`
  }

  function buildRecurringDonationMessage(userName, total, currency, durationLabel, projectLabel) {
    const baseMessage = `Merci <span id="username">${userName}</span> pour le don mensuel de <span id="tip">${total} ${currency}</span>`

    if (!durationLabel) {
      return `${baseMessage} ${projectLabel} !`
    }

    return `${baseMessage} depuis ${durationLabel} ${projectLabel} !`
  }

  // UI HELPERS

  function showCard(message) {
    const cardElement = document.createElement('div')
    cardElement.innerHTML = `
      <div class="card slideDown">
        ${logo()}
        <p>${message}</p>
      </div>`

    showElement(cardElement)
  }

  function showElement(element) {
    const wrapper = document.getElementById('ulule-widget-container')
    wrapper?.append(element)

    setTimeout(() => {
      element.remove()
    }, 5000)
  }

  function logo() {
    return '<div class="logo"></div>'
  }

  // IN-HOUSE HELPERS

  /**
   * Capitalizes the first character of a given string.
   */
  function capitalize(s) {
    return (s && String(s[0]).toUpperCase() + String(s).slice(1)) || ""
  }

  /**
   * Formats a duration with years and months into a French label.
   * Returns null if both are zero.
   */
  function getDurationLabel(years, months) {
    const yearsLabel = getYearsLabel(years)

    if (yearsLabel && months > 0) {
      return `${yearsLabel} et ${months} mois`
    }

    if (yearsLabel) {
      return yearsLabel
    }

    if (months > 0) {
      return `${months} mois`
    }

    return null
  }

  /**
   * Retrieves the best-matched localized string from an i18n resource object.
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