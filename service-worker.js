/** @type {ServiceWorkerGlobalScope} */
// @ts-ignore
// eslint-disable-next-line no-restricted-globals
const sw = self

sw.addEventListener("install", event => {
  console.log("[SW] Install")
  const p = updateCache().then(async () => {
    const clients = await sw.clients.matchAll({
      includeUncontrolled: true
    })
    clients.forEach(client => {
      const message = { type: "sw/install" }
      client.postMessage(message)
    })
  })
  event.waitUntil(p)
})

sw.addEventListener("activate", event => {
  console.log("[SW] Activate")
  sw.clients.claim()
})

sw.addEventListener("fetch", event => {
  const sUrl = event.request.url
  // console.log('[SW] Fetch', sUrl);

  const url = new URL(sUrl)
  if (url.pathname === "/pwa-hello-world/") {
    const p = loadCache(url.pathname)
    event.respondWith(p)
  }

  if (url.pathname === "/pwa-hello-world/assets/style.css") {
    const p = loadCache(url.pathname)
    event.respondWith(p)
  }

  if (url.pathname === "/pwa-hello-world/hello") {
    const content = ["Hommer", "Bart", "Marge", "Lisa"].sort(
      () => 0.5 - Math.random()
    )[0]
    event.respondWith(new Response(content, { status: 200 }))
    setTimeout(() => {
      showNotification(content, content.toLowerCase() + ".png")
    }, 1300)
  }
})

async function updateCache() {
  const cache = await sw.caches.open("pwa-hello-world")
  // Google fonts などの scope外のオブジェクトもキャッシュ可!
  await cache.addAll(["/pwa-hello-world/", "assets/style.css"])
}

/**
 * @param {RequestInfo} key
 */
async function loadCache(key) {
  const cache = await sw.caches.open("pwa-hello-world")
  return (await cache.match(key)) || new Response("", { status: 404 })
}

setInterval(async () => {
  // const text = 'SW#3' + Math.random();
  const text = "SW#6"
  console.log(`[SW] ${text}`)
  const clients = await sw.clients.matchAll()
  // console.log(clients)
  clients.forEach(client => {
    client.postMessage({
      text,
      type: "ping"
    })
  })
}, 1000)

sw.addEventListener("message", async event => {
  const message = event.data

  switch (message.type) {
    case "sw/skipWaiting": {
      sw.skipWaiting()
      break
    }

    default: // do nothing;
  }
})

/**
 * @param {string} body
 */
function showNotification(body, icon = "icon-512.png") {
  const title = "PWA"
  /** @type {NotificationOptions} */
  const options = {
    actions: [
      {
        action: "explore",
        title: "Explore this new world"
      },
      {
        action: "close",
        title: "Close notification"
      }
    ],
    body,
    icon: "/pwa-hello-world/assets/gpui/" + icon
  }
  sw.registration.showNotification(title, options)
}

sw.addEventListener("notificationclick", event => {
  const { action, notification } = event

  if (action === "close") {
    notification.close()
  } else {
    sw.clients.openWindow("http://www.example.com")
    notification.close()
  }
})

sw.addEventListener("notificationclick", event => {
  const { action, notification } = event

  if (action === "close") {
    notification.close()
  } else {
    sw.clients.openWindow("https://simpsons.fandom.com/wiki/Simpsons_Wiki")
    notification.close()
  }
})

sw.addEventListener('push', (event) => {
  const p = showNotification('Pushed!');
  event.waitUntil(p);
});