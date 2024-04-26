window.addEventListener("onWidgetLoad", async (obj) => {
  apiToken = obj.detail.channel.apiToken;

  const socket = io("https://realtime.streamelements.com", {
    transports: ["websocket"],
  });
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("authenticated", onAuthenticated);
  socket.on("unauthorized", console.error);

  function showElement(newElement) {
    const wrapper = document.getElementById("ulule");
    wrapper?.append(newElement);

    setTimeout(() => {
      newElement.remove();
    }, "5000");
  }

  function logo() {
    const logo = document.createElement("div");
    logo.innerHTML = `<div class='logo'></div>`;
    return logo.outerHTML;
  }

  socket.on("sub", (data) => {
    const newElement = document.createElement("div");

    //Si il y a un tip
    if (data.tip) {
      //Si l'utisateur est deja sub
      if (data.subName) {
        if (data.years) {
          newElement.innerHTML = `
          <div class='card slideDown'>
            <div class='logo'></div>
            <p>Abonné ${data.userName} Niveau ${data.subName} depuis ${data.years} an(s) et ${data.months} mois, merci pour le don de ${data.tip} !</p>
          </div>
        `;
        } else {
          newElement.innerHTML = `
          <div class='card slideDown'>
            <div class='logo'></div>
            <p>Abonné ${data.userName} Niveau ${data.subName} depuis ${data.months} mois, merci pour le don de ${data.tip} !</p>
          </div>
        `;
        }
      } else {
        // Si c'est juste un don
        newElement.innerHTML = `
            <div class='card slideDown'>
              <div class='logo'></div>
              <p>Don de ${data.tip}euros: merci ${data.userName}</p>
            </div>
          `;
      }
    } else {
      // Si l'utilisateur est deja sub et sans don
      if (data.months) {
        newElement.innerHTML = `
          <div class='card slideDown'>
            <div class='logo'></div>
            <p>Merci à ${data.userName} abonné Ulule Niveau ${data.subName} depuis ${data.months}/ mois !</p>
          </div>
        `;
      }

      newElement.innerHTML = `
        <div class='card slideDown'>
          <div class='logo'></div>
          <p>Nouvel abonnement ulule <span>${data.subName}</span> : merci <span>${data.userName}</span> !</p>
        </div>
      `;
    }

    showElement(newElement);
  });

  function onConnect() {
    console.log("Successfully connected to the websocket");
    // socket.emit('authenticate', {method: 'oauth2', token: accessToken});
    //socket.emit('authenticate', {method: 'jwt', token: jwt});
    socket.emit("authenticate", { method: "apikey", token: apiToken });
  }

  function onDisconnect() {
    console.log("Disconnected from websocket");
    // Reconnect
    onConnect();
  }

  function onAuthenticated(data) {
    console.log(`Successfully connected to channel `);
  }
});
