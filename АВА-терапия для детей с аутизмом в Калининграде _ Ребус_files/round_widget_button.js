(async () => {
  function getCookie(name) {
    const matches = document.cookie.match(new RegExp(
      '(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
    ))

    return matches ? decodeURIComponent(matches[1]) : undefined
  }

  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function updateCallTrackingCookie() {
    try {
      const callTrackingCookie = window.sessionStorage.getItem('callTrackingCookie')
      const oldCallTrackingCookie = callTrackingCookie ? JSON.parse(callTrackingCookie) : {}

      const currentCallTrackingCookie = {
        uis_id: getCookie('_comagic_idiGGhf')
      }

      window.sessionStorage.setItem('callTrackingCookie', JSON.stringify({
        ...oldCallTrackingCookie,
        ...currentCallTrackingCookie
      }))
    } catch {}
  }

  function updateUtm() {
    try {
      const utmQueriesString = window.sessionStorage.getItem('utmQueries')
      const oldUtmQueries = utmQueriesString ? JSON.parse(utmQueriesString) : {}

      const queries = new URLSearchParams(window.location.search)
      const queryKeys = Array.from(queries.keys())
      const utmKeys = queryKeys.filter(key => key.startsWith('utm_'))
      const currentUtmQueries = utmKeys.reduce((resultObject, utm) => {
        resultObject[utm] = queries.get(utm)

        return resultObject
      }, {})

      window.sessionStorage.setItem('utmQueries', JSON.stringify({
        ...oldUtmQueries,
        ...currentUtmQueries
      }))
    } catch {}
  }

  async function checkCOOPHeader() {
    if (!featureFlags.dms_widget_round_widget_header_fix) {
      return
    }

    try {
      const response = await fetch(location.href)
      const COOPHeader = response.headers.get('cross-origin-opener-policy');
      isStrictCOOPHeaderOnSite = typeof COOPHeader === 'string' && COOPHeader === 'same-origin'
    } catch { }
  }

  const widgetSrc = document.getElementById('medflexRoundWidgetData').dataset.src
  const widgetUrl = new URL(widgetSrc)
  const searchParams = new URLSearchParams(widgetUrl.search)
  const user = searchParams.get('user')
  let featureFlags = {}
  let isStrictCOOPHeaderOnSite = false

  if (!user) {
    return
  }

  updateUtm()
  updateCallTrackingCookie()

  const BASE_URL = widgetUrl.origin
  const WIDGET_SETTINGS_URL = `${BASE_URL}/utils/round_widget/settings/`
  const MEDFLEX_LOGO_URL = 'https://booking.medflex.ru/static/images/medflex-copyright.svg'

  const SVG_CROSS_D = 'M18.7722 6.32775C19.0759 6.02401 19.0759 5.53155 18.7722 5.22781C18.4685 4.92406 17.976 4.92406 17.6723 5.22781L12 10.9001L6.32775 5.22781C6.02401 4.92406 5.53155 4.92406 5.22781 5.22781C4.92406 5.53155 4.92406 6.02401 5.22781 6.32775L10.9001 12L5.22781 17.6723C4.92406 17.976 4.92406 18.4685 5.22781 18.7722C5.53155 19.0759 6.02401 19.0759 6.32775 18.7722L12 13.0999L17.6723 18.7722C17.976 19.0759 18.4685 19.0759 18.7722 18.7722C19.0759 18.4685 19.0759 17.976 18.7722 17.6723L13.0999 12L18.7722 6.32775Z'

  const defaultWidgetSettings = {
    color: '1A5DD0',
    mobile: {
      location: 'left',
      indent_x: 32,
      indent_y: 32
    },
    desktop: {
      location: 'right',
      indent_x: 32,
      indent_y: 32
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/utils/get_feature_status/`, {
      mode: 'cors'
    })

    if (response.ok) {
      const { features } = await response.json()
      featureFlags = features

      if (featureFlags.dms_temporary_disable_functionality) {
        return
      }
    }
  } catch {}

  checkCOOPHeader()

  function createRoundWidgetButton() {
    const roundWidgetButton = document.createElement('div')

    roundWidgetButton.classList.add('medflex-round-widget')

    roundWidgetButton.innerHTML = `
      <div class="medflex-round-widget__button">
        Запись
      </div>
      <div class="medflex-round-widget__iframe-wrapper">
        <div class="medflex-round-widget__iframe medflex-round-widget__iframe_loading">
          <div class="medflex-round-widget__header">
            Запись на приём к врачу
            <button class="medflex-round-widget__cross">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="${SVG_CROSS_D}" fill="#111111" />
              </svg>
            </button>
          </div>
          <div>
            <div class="medflex-round-widget__progress-wrapper">
              <svg
                class="medflex-round-widget__progress"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="21.132075471698116 21.132075471698116 42.26415094339623 42.26415094339623"
              >
                <circle
                  class="medflex-round-widget__progress-circle"
                  fill="transparent"
                  cx="42.26415094339623"
                  cy="42.26415094339623"
                  r="20"
                  stroke="#1A5DD0"
                  stroke-width="2.2641509433962264"
                  stroke-dasharray="125.664"
                  stroke-dashoffset="125.66370614359172px"
                ></circle>
              </svg>
            </div>
          </div>
          <div class="medflex-round-widget__footer">
            Виджет
            <div class="medflex-round-widget__logo"></div>
          </div>
        </div>
      </div>
    `

    return roundWidgetButton
  }

  function setWidgetsCss(widgetSettings) {
    const css = document.createElement('style')

    css.innerText = `
      .medflex-round-widget,
      .medflex-round-widget *,
      .medflex-round-widget *::before,
      .medflex-round-widget *::after {
        box-sizing: border-box;
      }

      .medflex-round-widget__iframe-wrapper {
        position: fixed;
        z-index: 999999999;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding-top: 40px;
        padding-bottom: 40px;
        background-color: rgba(0, 0, 0, 0.4);
      }

      .medflex-round-widget__iframe-wrapper:not(.medflex-round-widget__iframe-wrapper_show) {
        position: absolute;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      .medflex-round-widget__iframe {
        display: block;
        margin: 0 auto;
        max-width: 650px;
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 4px;
        box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);
        background-color: #FFFFFF;
      }

      .medflex-round-widget__iframe_loading {
        font-family: Inter, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .medflex-round-widget__header {
        font-size: 20px;
        font-weight: 600;
        line-height: 130%;
        letter-spacing: 0.15px;
        color: #111111;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        border-bottom: 1px solid #C7D1DF;
        padding: 8px;
      }

      .medflex-round-widget__footer {
        font-size: 16px;
        line-height: 125%;
        color: #8DA2BA;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.12), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 2px 4px -1px rgba(0, 0, 0, 0.20);
      }

      .medflex-round-widget__logo {
        width: 105px;
        height: 36px;
        margin-left: 4px;
        background-image: url('${MEDFLEX_LOGO_URL}');
        background-position: center center;
        background-repeat: no-repeat;
      }

      .medflex-round-widget__cross {
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .medflex-round-widget__progress-wrapper {
        margin: 0 auto;
        width: 56px;
        height: 56px;
      }

      .medflex-round-widget__progress {
        animation: progress-circular-rotate 1.4s linear infinite;
      }

      .medflex-round-widget__progress-circle {
        animation: progress-circular-dash 1.4s ease-in-out infinite;
        stroke-linecap: round;
        stroke-dasharray: 80, 200;
        stroke-dashoffset: 0px;
      }

      .medflex-round-widget__button {
        position: fixed;
        z-index: 999999995;
        bottom: ${widgetSettings.desktop.indent_y}px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 96px;
        height: 96px;
        cursor: pointer;
        border-radius: 50%;
        font-family: Inter, sans-serif;
        text-align: center;
        color: #FFFFFF;
        letter-spacing: 0.15px;
        font-weight: 600;
        font-size: 20px;
        line-height: 130%;
        box-shadow: 0 16px 16px #${widgetSettings.color}60;
        background-color: #${widgetSettings.color};
      }

      .medflex-round-widget__button::before,
      .medflex-round-widget__button::after {
        content: '';
        position: absolute;
        z-index: -1;
        left: 0;
        bottom: 0;
        height: 100%;
        width: 100%;
        cursor: pointer;
        border-radius: 50%;
        background-color: #${widgetSettings.color};
        animation-iteration-count: infinite;
      }

      .medflex-round-widget__button::before {
        animation-name: pulse-circle;
        animation-duration: 2.8s;
      }

      .medflex-round-widget__button::after {
        animation-duration: 2.8s;
        animation-name: pulse-animated-circle;
        animation-timing-function: ease-out;
      }

      @media screen and (min-width: 651px) {
        .medflex-round-widget__button {
          ${widgetSettings.desktop.location}: ${widgetSettings.desktop.indent_x}px;
        }
      }

      @media screen and (max-width: 650.98px) {
        .medflex-round-widget__iframe-wrapper {
          padding: 0;
        }
        .medflex-round-widget__iframe {
          border-radius: 0;
        }
        .medflex-round-widget__button {
          ${widgetSettings.mobile.location}: ${widgetSettings.mobile.indent_x}px;
          bottom: ${widgetSettings.mobile.indent_y}px;
        }
      }

      @keyframes pulse-animated-circle {
        0% {
          transform: scale(1);
        }
        10% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }

      @keyframes pulse-circle {
        60% {
          opacity: 0;
          transform: scale(1);
        }
        75% {
          opacity: 0.5;
          transform: scale(1.1);
        }
        90% {
          opacity: 0;
          transform: scale(1.4);
        }
        100% {
          opacity: 0;
          transform: scale(1);
        }
      }

      @keyframes progress-circular-dash {
        0% {
          stroke-dasharray: 1, 200;
          stroke-dashoffset: 0px;
        }
        50% {
          stroke-dasharray: 100, 200;
          stroke-dashoffset: -15px;
        }
        100% {
          stroke-dasharray: 100, 200;
          stroke-dashoffset: -125px;
        }
      }

      @keyframes progress-circular-rotate {
        100% {
          transform: rotate(360deg);
        }
      }
    `

    document.head.append(css)
  }

  function createIframeElement() {
    const iframe = document.createElement('iframe')

    iframe.src = widgetSrc
    iframe.className = 'medflex-round-widget__iframe'
    iframe.style.display = 'none'

    return iframe
  }

  function setWidgetToPage(widgetSettings = defaultWidgetSettings) {
    const { body } = document

    if (!body) {
      return
    }

    const roundWidgetButton = createRoundWidgetButton()

    body.append(roundWidgetButton)

    const iframeWrapperShowClass = 'medflex-round-widget__iframe-wrapper_show'
    const iframeWrapperElement = document.querySelector('.medflex-round-widget__iframe-wrapper')
    const iframeElement = createIframeElement()

    const addIframeElementCallback = (event) => {
      if (event.target.closest('.medflex-round-widget__button')) {
        iframeWrapperElement.appendChild(iframeElement)
        document.removeEventListener('click', addIframeElementCallback)
      }
    }

    window.addEventListener('message', (event) => {
      if (!widgetSrc.startsWith(event.origin)) {
        return
      }

      if (event.data === 'closeFrame') {
        iframeWrapperElement.classList.remove(iframeWrapperShowClass)
      }

      if (event.data === 'showFrame') {
        const iframeLoading = document.querySelector('.medflex-round-widget__iframe_loading')

        if (iframeLoading) {
          iframeLoading.parentNode.removeChild(iframeLoading)
          iframeElement.style.display = 'block'
        }

        const cookies = document.cookie ? document.cookie.split('; ') : []
        const cookieYmIdString = cookies.find(cookies => cookies.startsWith('_ym_uid'))
        const cookieYmId = cookieYmIdString?.split('=')

        iframeElement.contentWindow?.postMessage(JSON.stringify({
          type: 'setUtmAndYmId',
          body: {
            utmQueries: JSON.parse(window.sessionStorage.getItem('utmQueries')),
            ymId: cookieYmIdString ? cookieYmId[1] : undefined
          }
        }), '*')

        iframeElement.contentWindow?.postMessage(JSON.stringify({
          type: 'setCallTrackingCookie',
          body: {
            callTrackingCookie: JSON.parse(window.sessionStorage.getItem('callTrackingCookie'))
          }
        }), '*')

        iframeElement.contentWindow?.postMessage(JSON.stringify({
          type: 'sendOpenMetric'
        }), '*')

        iframeElement.contentWindow?.postMessage(JSON.stringify({
          type: 'sendParentInfo',
          body: {
            href: location.href
          }
        }), '*')

        function sendDeviceSizes() {
          iframeElement.contentWindow?.postMessage(JSON.stringify({
            type: 'sendDeviceSizes',
            body: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          }), '*')
        }

        sendDeviceSizes()

        window.addEventListener('resize', debounce(sendDeviceSizes, 100))
      }
    })

    document.addEventListener('click', (event) => {
      if (event.target.closest('.medflex-round-widget__button')) {
        if (isStrictCOOPHeaderOnSite) {
          const targetUrl = new URL(widgetUrl)
          targetUrl.searchParams.delete('isRoundWidget')
          targetUrl.searchParams.set('source', '3')
          window.open(targetUrl)

          return
        }

        iframeWrapperElement.classList.add(iframeWrapperShowClass)

        iframeElement.contentWindow?.postMessage(JSON.stringify({
          type: 'sendOpenMetric'
        }), '*')
      }

      if (event.target.closest('.medflex-round-widget__cross')) {
        iframeWrapperElement.classList.remove(iframeWrapperShowClass)
      }
    })

    document.addEventListener('click', addIframeElementCallback)

    setWidgetsCss(widgetSettings)
  }

  function widgetSetup() {
    const xhr = new XMLHttpRequest()

    xhr.addEventListener('load', () => {
      try {
        setWidgetToPage(JSON.parse(xhr.responseText))
      } catch {
        setWidgetToPage()
      }
    })

    xhr.addEventListener('error', () => setWidgetToPage())

    xhr.open('GET', WIDGET_SETTINGS_URL)
    xhr.setRequestHeader('User', user)

    xhr.send()
  }

  widgetSetup()
})()
