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

  socket.on('contribution', (data) => {
    const cardElement = document.createElement('div')
    const userName = Boolean(data.userName) ? data.userName : 'Une personne anonyme'
    const tip = Number(data.tip)

    if (!tip) {
      // Cas de contribution sans don libre
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p><span id="username">${userName}</span> vient de choisir la contrepartie <span id="subname">« ${data.rewardName} »</span> !</p>
        </div>`
    } else {
      // Cas de contribution avec don libre
      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p><span id="username">${userName}</span> vient de choisir <span id="subname">« ${data.rewardName} »</span> + un don de <span id="tip">${tip} ${data.currency}</span> !</p>
        </div>`
    }

    showElement(cardElement)
  })

  socket.on('sub', (data) => {
    const cardElement = document.createElement('div')

    // Si il y a un don
    if (data.tip) {
      // Cas d'utilisateur·ice déja abonné·e
      if (data.subName) {
        if (data.years !== 0 && data.years !== 'null' && data.years !== '0' && data.years !== undefined) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${data.userName}</span> pour le don de <span id="tip">${data.tip} ${data.currency}</span> ! Abonné·e au niveau <span id="subname">"${data.subName}"</span> depuis ${data.years} an(s) et ${data.months} mois</p>
          </div>`
        } else if (data.months !== 0 && data.months !== 'null' && data.months !== '0' && data.months !== undefined) {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${data.userName}</span> pour le don de <span id="tip">${data.tip} ${data.currency}</span> ! Abonné·e au niveau <span id="subname">"${data.subName}"</span> depuis ${data.months} mois</p>
          </div>`
        } else {
          cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${data.userName}</span> pour le don de <span id="tip">${data.tip} ${data.currency}</span> ! Abonné·e au niveau <span id="subname">"${data.subName}"</span></p>
          </div>`
        }
      } else {
        // Si c'est un don récurrent
        if (data.isRecurringDonation === 'True' && data.recurringDonationAmount > 0) {
          cardElement.innerHTML = `
            <div class="card slideDown">
              <div class="logo"></div>
              <p>Merci <span id="username">${data.userName}</span> pour le don mensuel de <span id="tip">${data.recurringDonationAmount} ${data.currency}</span> !</p>
            </div>`
        } else {
          // Si c'est un don unique
          cardElement.innerHTML = `
              <div class="card slideDown">
                <div class="logo"></div>
                <p>Merci <span id="username">${data.userName}</span> pour le don de <span id="tip">${data.tip} ${data.currency}</span> !</p>
              </div>`
        }
      }
    } else {
      // Cas d'utilisateur·ice déja abonné·e, sans don
      if (data.months) {
        cardElement.innerHTML = `
          <div class="card slideDown">
            <div class="logo"></div>
            <p>Merci <span id="username">${data.userName}</span> pour les ${data.months} mois d'abonnement au niveau <span id="subname">"${data.subName}"</span> !</p>
          </div>`
      }

      cardElement.innerHTML = `
        <div class="card slideDown">
          <div class="logo"></div>
          <p>Merci <span id="username">${data.userName}</span> pour le nouvel abonnement au niveau <span id="subname">"${data.subName}"</span> !</p>
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
})
