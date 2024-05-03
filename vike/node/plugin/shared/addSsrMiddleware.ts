export { addSsrMiddleware }

import { renderPage } from '../../runtime/renderPage.js'
import type { ViteDevServer } from 'vite'
import { assertWarning } from '../utils.js'
type ConnectServer = ViteDevServer['middlewares']

function addSsrMiddleware(middlewares: ConnectServer) {
  middlewares.use(async (req, res, next) => {
    if (res.headersSent) return next()
    const url = req.originalUrl || req.url
    if (!url) return next()
    const { headers } = req
    const pageContextInit = {
      urlOriginal: url,
      get userAgent() {
        assertWarning(false, "pageContext.userAgent is deprecated: use pageContext.headers['user-agent'] instead", {
          showStackTrace: true,
          onlyOnce: true
        })
        return headers['user-agent']
      },
      headersOriginal: headers
    }
    let pageContext: Awaited<ReturnType<typeof renderPage>>
    try {
      pageContext = await renderPage(pageContextInit)
    } catch (err) {
      // Throwing an error in a connect middleware shut downs the server
      console.error(err)
      // - next(err) automatically uses buildErrorMessage() (pretty formatting of Rollup errors)
      //   - But it only works for users using Vite's standalone dev server (it doesn't work for users using Vite's dev middleware)
      // - We purposely don't use next(err) to align behavior: we use our own/copied implementation of buildErrorMessage() regardless of whether the user uses Vite's dev middleware or Vite's standalone dev server
      return next()
    }

    if (!pageContext.httpResponse) {
      return next()
    } else {
      const { statusCode, headers } = pageContext.httpResponse
      headers.forEach(([name, value]) => res.setHeader(name, value))
      res.statusCode = statusCode
      pageContext.httpResponse.pipe(res)
    }
  })
}
