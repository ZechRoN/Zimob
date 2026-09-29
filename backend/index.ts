var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
};

// node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value, nestingState);
        delete form2[key];
      }
    });
  }
  return form2;
}
var handleParsingAllValues = (form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      ;
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form2, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form2;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
        return new Response(body, {
          headers: contentType ? { "Content-Type": contentType } : void 0
        })[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibytes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class _Node2 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    } else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else {
      return () => "";
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (exposeHeadersStr) {
      set("Access-Control-Expose-Headers", exposeHeadersStr);
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        c.res.headers.append("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods) {
        set("Access-Control-Allow-Methods", allowMethods);
      }
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
        }
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// node_modules/@blinkdotnew/sdk/dist/index.mjs
var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
}) : x)(function(x) {
  if (typeof __require !== "undefined") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
function isReactNativeFile(file) {
  return typeof file === "object" && file !== null && typeof file.uri === "string";
}
function detectPlatform() {
  if (typeof Deno !== "undefined") {
    return "deno";
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
      return "react-native";
    }
    return "node";
  }
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return "react-native";
  }
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "web";
  }
  return "node";
}
var platform = detectPlatform();
var isWeb = platform === "web";
var isReactNative = platform === "react-native";
var isDeno = platform === "deno";
var isBrowser = isWeb || isReactNative;
var WebStorageAdapter = class {
  getItem(key) {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("Failed to get item from localStorage:", error);
      return null;
    }
  }
  setItem(key, value) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("Failed to set item in localStorage:", error);
    }
  }
  removeItem(key) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove item from localStorage:", error);
    }
  }
  clear() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.clear();
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  }
};
var NoOpStorageAdapter = class {
  getItem(_key) {
    return null;
  }
  setItem(_key, _value) {
  }
  removeItem(_key) {
  }
  clear() {
  }
};
function getDefaultStorageAdapter() {
  if (isDeno) {
    return new NoOpStorageAdapter();
  }
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("__test__", "test");
      localStorage.removeItem("__test__");
      return new WebStorageAdapter();
    } catch {
    }
  }
  return new NoOpStorageAdapter();
}
var BlinkError = class extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = "BlinkError";
  }
};
var BlinkAuthError = class extends BlinkError {
  code;
  retryable;
  userMessage;
  constructor(code, message, userMessage, details) {
    super(message, code, 401, details);
    this.name = "BlinkAuthError";
    this.code = code;
    this.retryable = ["NETWORK_ERROR", "RATE_LIMITED"].includes(code);
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
  }
  getDefaultUserMessage(code) {
    switch (code) {
      case "INVALID_CREDENTIALS":
        return "Invalid email or password. Please try again.";
      case "EMAIL_NOT_VERIFIED":
        return "Please verify your email address before signing in.";
      case "POPUP_CANCELED":
        return "Sign-in was canceled. Please try again.";
      case "NETWORK_ERROR":
        return "Network error. Please check your connection and try again.";
      case "RATE_LIMITED":
        return "Too many attempts. Please wait a moment and try again.";
      case "AUTH_TIMEOUT":
        return "Authentication timed out. Please try again.";
      case "REDIRECT_FAILED":
        return "Redirect failed. Please try again.";
      case "TOKEN_EXPIRED":
        return "Session expired. Please sign in again.";
      case "USER_NOT_FOUND":
        return "User not found. Please check your email and try again.";
      case "EMAIL_ALREADY_EXISTS":
        return "An account with this email already exists.";
      case "WEAK_PASSWORD":
        return "Password is too weak. Please choose a stronger password.";
      case "INVALID_EMAIL":
        return "Please enter a valid email address.";
      case "MAGIC_LINK_EXPIRED":
        return "Magic link has expired. Please request a new one.";
      case "VERIFICATION_FAILED":
        return "Verification failed. Please try again.";
      default:
        return "Authentication error. Please try again.";
    }
  }
};
var BlinkNetworkError = class extends BlinkError {
  constructor(message, status, details, code) {
    super(message, code || "NETWORK_ERROR", status, details);
    this.name = "BlinkNetworkError";
  }
};
function upstreamStatus(error) {
  return error instanceof BlinkError ? error.status : void 0;
}
function upstreamCode(error) {
  if (!(error instanceof BlinkError)) return void 0;
  const body = error.details;
  const code = body?.error?.code ?? body?.code;
  return typeof code === "string" && code ? code : void 0;
}
var BlinkValidationError = class extends BlinkError {
  constructor(message, details, code) {
    super(message, code || "VALIDATION_ERROR", 400, details);
    this.name = "BlinkValidationError";
  }
};
var BlinkStorageError = class extends BlinkError {
  constructor(message, status, details, code) {
    super(message, code || "STORAGE_ERROR", status, details);
    this.name = "BlinkStorageError";
  }
};
var BlinkAIError = class extends BlinkError {
  constructor(message, status, details, code) {
    super(message, code || "AI_ERROR", status, details);
    this.name = "BlinkAIError";
  }
};
var BlinkDataError = class extends BlinkError {
  constructor(message, status, details) {
    super(message, "DATA_ERROR", status, details);
    this.name = "BlinkDataError";
  }
};
var BlinkRealtimeError = class extends BlinkError {
  constructor(message, status, details) {
    super(message, "REALTIME_ERROR", status, details);
    this.name = "BlinkRealtimeError";
  }
};
var BlinkNotificationsError = class extends BlinkError {
  constructor(message, status, details) {
    super(message, "NOTIFICATIONS_ERROR", status, details);
    this.name = "BlinkNotificationsError";
  }
};
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function convertFilterKeysToSnakeCase(condition) {
  if (!condition) return condition;
  if ("AND" in condition) {
    return {
      AND: condition.AND?.map(convertFilterKeysToSnakeCase)
    };
  }
  if ("OR" in condition) {
    return {
      OR: condition.OR?.map(convertFilterKeysToSnakeCase)
    };
  }
  const converted = {};
  for (const [field, value] of Object.entries(condition)) {
    const snakeField = camelToSnake(field);
    converted[snakeField] = value;
  }
  return converted;
}
function buildFilterQuery(condition) {
  if (!condition) return "";
  if ("AND" in condition) {
    const andConditions = condition.AND?.map(buildFilterQuery).filter(Boolean) || [];
    return andConditions.length > 0 ? `and=(${andConditions.join(",")})` : "";
  }
  if ("OR" in condition) {
    const orConditions = condition.OR?.map(buildFilterQuery).filter(Boolean) || [];
    return orConditions.length > 0 ? `or=(${orConditions.join(",")})` : "";
  }
  const params = [];
  for (const [field, value] of Object.entries(condition)) {
    if (value === void 0 || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      for (const [operator, operatorValue] of Object.entries(value)) {
        const param = buildOperatorQuery(field, operator, operatorValue);
        if (param) params.push(param);
      }
    } else {
      params.push(`${field}=eq.${encodeQueryValue(value)}`);
    }
  }
  return params.join("&");
}
function buildOperatorQuery(field, operator, value) {
  switch (operator) {
    case "eq":
      return `${field}=eq.${encodeQueryValue(value)}`;
    case "neq":
      return `${field}=neq.${encodeQueryValue(value)}`;
    case "gt":
      return `${field}=gt.${encodeQueryValue(value)}`;
    case "gte":
      return `${field}=gte.${encodeQueryValue(value)}`;
    case "lt":
      return `${field}=lt.${encodeQueryValue(value)}`;
    case "lte":
      return `${field}=lte.${encodeQueryValue(value)}`;
    case "like":
      return `${field}=like.${encodeQueryValue(value)}`;
    case "ilike":
      return `${field}=ilike.${encodeQueryValue(value)}`;
    case "is":
      return `${field}=is.${value === null ? "null" : encodeQueryValue(value)}`;
    case "not":
      return `${field}=not.${encodeQueryValue(value)}`;
    case "in":
      if (Array.isArray(value)) {
        const values = value.map(encodeQueryValue).join(",");
        return `${field}=in.(${values})`;
      }
      return "";
    case "not_in":
      if (Array.isArray(value)) {
        const values = value.map(encodeQueryValue).join(",");
        return `${field}=not.in.(${values})`;
      }
      return "";
    default:
      return "";
  }
}
function encodeQueryValue(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  if (typeof value === "number") return value.toString();
  return String(value);
}
function collectFilterParams(condition, params) {
  if (!condition) return;
  if ("AND" in condition) {
    const andConditions = condition.AND?.map(buildFilterQuery).filter(Boolean) || [];
    if (andConditions.length > 0) params["and"] = `(${andConditions.join(",")})`;
    return;
  }
  if ("OR" in condition) {
    const orConditions = condition.OR?.map(buildFilterQuery).filter(Boolean) || [];
    if (orConditions.length > 0) params["or"] = `(${orConditions.join(",")})`;
    return;
  }
  for (const [field, value] of Object.entries(condition)) {
    if (value === void 0 || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      for (const [operator, operatorValue] of Object.entries(value)) {
        const param = buildOperatorQuery(field, operator, operatorValue);
        if (param) {
          const eqIdx = param.indexOf("=");
          if (eqIdx !== -1) params[param.slice(0, eqIdx)] = param.slice(eqIdx + 1);
        }
      }
    } else {
      params[field] = `eq.${encodeQueryValue(value)}`;
    }
  }
}
function buildQuery(options = {}) {
  const params = {};
  if (options.select && options.select.length > 0) {
    const snakeFields = options.select.map(camelToSnake);
    params.select = snakeFields.join(",");
  } else {
    params.select = "*";
  }
  if (options.where) {
    collectFilterParams(convertFilterKeysToSnakeCase(options.where), params);
  }
  if (options.orderBy) {
    if (typeof options.orderBy === "string") {
      params.order = options.orderBy;
    } else {
      const orderClauses = Object.entries(options.orderBy).map(([field, direction]) => `${camelToSnake(field)}.${direction}`);
      params.order = orderClauses.join(",");
    }
  }
  if (options.limit !== void 0) {
    params.limit = options.limit.toString();
  }
  if (options.offset !== void 0) {
    params.offset = options.offset.toString();
  }
  if (options.cursor) {
    params.cursor = options.cursor;
  }
  return params;
}
function toAuthErrorCode(code) {
  return typeof code === "string" && code ? code : "UNAUTHORIZED";
}
function parseErrorBody(body, status) {
  const errorStr = typeof body?.error === "string" ? body.error : null;
  const detailsStr = typeof body?.details === "string" ? body.details : null;
  const composed = errorStr && detailsStr ? `${errorStr}: ${detailsStr}` : errorStr || detailsStr;
  return {
    message: body?.error?.message || body?.message || composed || `HTTP ${status}`,
    code: body?.error?.code || body?.code
  };
}
function camelToSnake2(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function convertKeysToSnakeCase(obj) {
  if (obj === null || obj === void 0) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake2(key);
    converted[snakeKey] = convertKeysToSnakeCase(value);
  }
  return converted;
}
function convertKeysToCamelCase(obj) {
  if (obj === null || obj === void 0) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamelCase);
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    converted[camelKey] = convertKeysToCamelCase(value);
  }
  return converted;
}
var HttpClient = class {
  authUrl = "https://blink.new";
  coreUrl = "https://core.blink.new";
  projectId;
  publishableKey;
  secretKey;
  // Permanent, non-expiring key (like Stripe's sk_live_...)
  getToken;
  getValidToken;
  forceRefreshToken;
  constructor(config, getToken, getValidToken, forceRefreshToken) {
    this.projectId = config.projectId;
    this.publishableKey = config.publishableKey;
    this.secretKey = config.secretKey || config.serviceToken;
    this.getToken = getToken;
    this.getValidToken = getValidToken;
    this.forceRefreshToken = forceRefreshToken;
  }
  /**
   * Whether a 401 on this request is worth recovering from by forcing a
   * user-token refresh and retrying once.
   *
   * Only meaningful for user-JWT auth: server-side `secretKey` 401s are real
   * authorization failures a refresh cannot fix, and publishable-key requests
   * carry no user token to refresh.
   */
  canAttemptTokenRefresh(token) {
    return !!this.forceRefreshToken && !this.secretKey && !!token;
  }
  shouldAttachPublishableKey(path, method) {
    if (method !== "GET" && method !== "POST") return false;
    if (path.includes("/api/analytics/")) return true;
    if (path.includes("/api/storage/")) return true;
    if (path.includes("/api/db/") && path.includes("/rest/v1/")) return method === "GET";
    return false;
  }
  shouldSkipSecretKey(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith(".functions.blink.new") || parsed.hostname.endsWith(".backend.blink.new");
    } catch {
      return false;
    }
  }
  getAuthorizationHeader(url, token) {
    if (this.secretKey && !this.shouldSkipSecretKey(url)) {
      return `Bearer ${this.secretKey}`;
    }
    if (token) {
      return `Bearer ${token}`;
    }
    return null;
  }
  /**
   * Make an authenticated request to the Blink API
   */
  async request(path, options = {}) {
    const url = this.buildUrl(path, options.searchParams);
    const method = options.method || "GET";
    const sendRequest = (token) => {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers
      };
      const auth = this.getAuthorizationHeader(url, token);
      if (auth) {
        headers.Authorization = auth;
      } else if (this.publishableKey && !headers["x-blink-publishable-key"] && this.shouldAttachPublishableKey(path, method)) {
        headers["x-blink-publishable-key"] = this.publishableKey;
      }
      const requestInit = {
        method,
        headers,
        signal: options.signal
      };
      if (options.body && method !== "GET") {
        requestInit.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
      }
      return fetch(url, requestInit);
    };
    try {
      const token = this.getValidToken ? await this.getValidToken() : this.getToken();
      let response = await sendRequest(token);
      if (response.status === 401 && this.canAttemptTokenRefresh(token)) {
        const refreshedToken = await this.forceRefreshToken();
        if (refreshedToken) {
          response = await sendRequest(refreshedToken);
        }
      }
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      const data = await this.parseResponse(response);
      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      if (error instanceof BlinkError) {
        throw error;
      }
      throw new BlinkNetworkError(
        `Network request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        { originalError: error }
      );
    }
  }
  /**
   * GET request
   */
  async get(path, searchParams) {
    return this.request(path, { method: "GET", searchParams });
  }
  /**
   * POST request
   */
  async post(path, body, headers) {
    return this.request(path, { method: "POST", body, headers });
  }
  /**
   * PATCH request
   */
  async patch(path, body, headers) {
    return this.request(path, { method: "PATCH", body, headers });
  }
  /**
   * DELETE request
   */
  async delete(path, searchParams) {
    return this.request(path, { method: "DELETE", searchParams });
  }
  /**
   * Database-specific requests
   */
  // Table operations (PostgREST-compatible)
  async dbGet(table, searchParams) {
    const response = await this.get(`/api/db/${this.projectId}/rest/v1/${table}`, searchParams);
    const convertedData = convertKeysToCamelCase(response.data);
    return {
      ...response,
      data: convertedData
    };
  }
  async dbPost(table, body, options = {}) {
    const headers = {};
    if (options.returning) {
      headers.Prefer = "return=representation";
    }
    const convertedBody = convertKeysToSnakeCase(body);
    const response = await this.post(`/api/db/${this.projectId}/rest/v1/${table}`, convertedBody, headers);
    const convertedData = convertKeysToCamelCase(response.data);
    return {
      ...response,
      data: convertedData
    };
  }
  async dbUpsert(table, body, options = {}) {
    const headers = {};
    if (options.returning) {
      headers.Prefer = "return=representation";
    }
    const convertedBody = convertKeysToSnakeCase(body);
    const onConflict = options.onConflict || "id";
    const response = await this.request(
      `/api/db/${this.projectId}/rest/v1/${table}`,
      {
        method: "POST",
        body: convertedBody,
        headers,
        searchParams: { on_conflict: onConflict }
      }
    );
    const convertedData = convertKeysToCamelCase(response.data);
    return {
      ...response,
      data: convertedData
    };
  }
  async dbPatch(table, body, searchParams, options = {}) {
    const headers = {};
    if (options.returning) {
      headers.Prefer = "return=representation";
    }
    const convertedBody = convertKeysToSnakeCase(body);
    const response = await this.request(`/api/db/${this.projectId}/rest/v1/${table}`, {
      method: "PATCH",
      body: convertedBody,
      headers,
      searchParams
    });
    const convertedData = convertKeysToCamelCase(response.data);
    return {
      ...response,
      data: convertedData
    };
  }
  async dbDelete(table, searchParams, options = {}) {
    const headers = {};
    if (options.returning) {
      headers.Prefer = "return=representation";
    }
    const response = await this.request(`/api/db/${this.projectId}/rest/v1/${table}`, {
      method: "DELETE",
      headers,
      searchParams
    });
    const convertedData = convertKeysToCamelCase(response.data);
    return {
      ...response,
      data: convertedData
    };
  }
  // Raw SQL operations
  async dbSql(query, params) {
    const response = await this.post(`/api/db/${this.projectId}/sql`, { query, params });
    const convertedData = {
      ...response.data,
      rows: convertKeysToCamelCase(response.data.rows)
    };
    return {
      ...response,
      data: convertedData
    };
  }
  // Batch SQL operations
  async dbBatch(statements2, mode = "write") {
    const response = await this.post(`/api/db/${this.projectId}/batch`, { statements: statements2, mode });
    const convertedData = {
      ...response.data,
      results: response.data.results.map((result) => ({
        ...result,
        rows: convertKeysToCamelCase(result.rows)
      }))
    };
    return {
      ...response,
      data: convertedData
    };
  }
  /**
   * Upload file with progress tracking
   */
  async uploadFile(path, file, filePath, options = {}) {
    const url = this.buildUrl(path);
    const formData = new FormData();
    const fallbackName = filePath.split("/").pop() || "file";
    if (isReactNativeFile(file)) {
      const part = {
        uri: file.uri,
        name: file.name || fallbackName,
        type: file.type || options.contentType || "application/octet-stream"
      };
      formData.append("file", part);
    } else if (typeof File !== "undefined" && file instanceof File) {
      formData.append("file", file);
    } else if (typeof Blob !== "undefined" && file instanceof Blob) {
      if (isReactNative) {
        formData.append("file", file, fallbackName);
      } else {
        const blobWithType = options.contentType ? new Blob([file], { type: options.contentType }) : file;
        formData.append("file", blobWithType, fallbackName);
      }
    } else if (file instanceof ArrayBuffer) {
      const blob = new Blob([new Uint8Array(file)], { type: options.contentType || "application/octet-stream" });
      formData.append("file", blob, fallbackName);
    } else if (typeof Buffer !== "undefined" && file instanceof Buffer) {
      const blob = new Blob([new Uint8Array(file)], { type: options.contentType || "application/octet-stream" });
      formData.append("file", blob, fallbackName);
    } else {
      throw new BlinkValidationError("Unsupported file type");
    }
    formData.append("path", filePath);
    const attempt = async (allowRetry) => {
      const token = this.getValidToken ? await this.getValidToken() : this.getToken();
      const headers = {};
      const auth = this.getAuthorizationHeader(url, token);
      if (auth) {
        headers.Authorization = auth;
      } else if (this.publishableKey && path.includes("/api/storage/") && !headers["x-blink-publishable-key"]) {
        headers["x-blink-publishable-key"] = this.publishableKey;
      }
      try {
        if (typeof XMLHttpRequest !== "undefined" && options.onProgress) {
          return await this.uploadWithProgress(url, formData, headers, options.onProgress);
        }
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: formData
        });
        if (response.status === 401 && allowRetry && this.canAttemptTokenRefresh(token)) {
          const refreshedToken = await this.forceRefreshToken();
          if (refreshedToken) {
            return attempt(false);
          }
        }
        if (!response.ok) {
          await this.handleErrorResponse(response);
        }
        const data = await this.parseResponse(response);
        return {
          data,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        if (allowRetry && error instanceof BlinkAuthError && this.canAttemptTokenRefresh(token)) {
          const refreshedToken = await this.forceRefreshToken();
          if (refreshedToken) {
            return attempt(false);
          }
        }
        if (error instanceof BlinkError) {
          throw error;
        }
        throw new BlinkNetworkError(
          `File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          0,
          { originalError: error }
        );
      }
    };
    return attempt(true);
  }
  /**
   * Upload with progress tracking using XMLHttpRequest
   */
  uploadWithProgress(url, formData, headers, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round(event.loaded / event.total * 100);
          onProgress(percent);
        }
      });
      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              status: xhr.status,
              headers: new Headers()
              // XMLHttpRequest doesn't provide easy access to response headers
            });
          } catch (error) {
            reject(new BlinkNetworkError("Failed to parse response", xhr.status));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            const { message, code } = parseErrorBody(errorData, xhr.status);
            switch (xhr.status) {
              case 401:
                reject(new BlinkAuthError(
                  toAuthErrorCode(code),
                  message,
                  void 0,
                  errorData
                ));
                break;
              case 400:
                reject(new BlinkValidationError(message, errorData, code));
                break;
              default:
                reject(new BlinkNetworkError(message, xhr.status, errorData, code));
            }
          } catch {
            reject(new BlinkNetworkError(`HTTP ${xhr.status}`, xhr.status));
          }
        }
      });
      xhr.addEventListener("error", () => {
        reject(new BlinkNetworkError("Network error during file upload"));
      });
      xhr.open("POST", url);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      xhr.send(formData);
    });
  }
  /**
   * AI-specific requests
   */
  async aiText(prompt, options = {}) {
    const { signal, ...body } = options;
    const requestBody = { ...body };
    if (prompt) {
      requestBody.prompt = prompt;
    }
    return this.request(`/api/ai/${this.projectId}/text`, {
      method: "POST",
      body: requestBody,
      signal
    });
  }
  /**
   * Stream AI text generation - uses Vercel AI SDK's pipeUIMessageStreamToResponse (Data Stream Protocol)
   */
  async streamAiText(prompt, options = {}, onChunk) {
    const url = this.buildUrl(`/api/ai/${this.projectId}/text`);
    const token = this.getValidToken ? await this.getValidToken() : this.getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    const auth = this.getAuthorizationHeader(url, token);
    if (auth) headers.Authorization = auth;
    const body = {
      prompt,
      stream: true,
      ...options
    };
    const { signal: _signal, ...jsonBody } = body;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(jsonBody),
        signal: options.signal
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      if (!response.body) {
        throw new BlinkNetworkError("No response body for streaming");
      }
      return this.parseDataStreamProtocol(response.body, onChunk);
    } catch (error) {
      if (error instanceof BlinkError) {
        throw error;
      }
      throw new BlinkNetworkError(
        `Streaming request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        { originalError: error }
      );
    }
  }
  async aiObject(prompt, options = {}) {
    const { signal, ...body } = options;
    const requestBody = { ...body };
    if (prompt) {
      requestBody.prompt = prompt;
    }
    return this.request(`/api/ai/${this.projectId}/object`, {
      method: "POST",
      body: requestBody,
      signal
    });
  }
  /**
   * Stream AI object generation - uses Vercel AI SDK's pipeTextStreamToResponse
   */
  async streamAiObject(prompt, options = {}, onPartial) {
    const url = this.buildUrl(`/api/ai/${this.projectId}/object`);
    const token = this.getValidToken ? await this.getValidToken() : this.getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    const auth = this.getAuthorizationHeader(url, token);
    if (auth) headers.Authorization = auth;
    const body = {
      prompt,
      stream: true,
      ...options
    };
    const { signal: _signal2, ...jsonBody2 } = body;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(jsonBody2),
        signal: options.signal
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      if (!response.body) {
        throw new BlinkNetworkError("No response body for streaming");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let latestObject = {};
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          try {
            const parsed = JSON.parse(buffer);
            latestObject = parsed;
            if (onPartial) {
              onPartial(parsed);
            }
          } catch {
          }
        }
        if (buffer) {
          try {
            latestObject = JSON.parse(buffer);
          } catch {
          }
        }
        return { object: latestObject };
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof BlinkError) {
        throw error;
      }
      throw new BlinkNetworkError(
        `Streaming request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        { originalError: error }
      );
    }
  }
  async aiImage(prompt, options = {}) {
    const { signal, ...body } = options;
    return this.request(`/api/ai/${this.projectId}/image`, {
      method: "POST",
      body: {
        prompt,
        ...body
      },
      signal
    });
  }
  async aiSpeech(text, options = {}) {
    const { signal, ...body } = options;
    return this.request(`/api/ai/${this.projectId}/speech`, {
      method: "POST",
      body: {
        text,
        ...body
      },
      signal
    });
  }
  async aiTranscribe(audio, options = {}) {
    const { signal, ...body } = options;
    let payloadAudio;
    if (typeof audio === "string" || Array.isArray(audio)) {
      payloadAudio = audio;
    } else if (audio instanceof Uint8Array) {
      payloadAudio = Array.from(audio);
    } else if (audio instanceof ArrayBuffer) {
      payloadAudio = Array.from(new Uint8Array(audio));
    } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(audio)) {
      payloadAudio = Array.from(new Uint8Array(audio));
    } else {
      throw new BlinkValidationError("Unsupported audio input type");
    }
    return this.request(`/api/ai/${this.projectId}/transcribe`, {
      method: "POST",
      body: {
        audio: payloadAudio,
        ...body
      },
      signal
    });
  }
  async aiVideo(prompt, options = {}) {
    const { signal, ...body } = options;
    return this.request(`/api/ai/${this.projectId}/video`, {
      method: "POST",
      body: {
        prompt,
        ...body
      },
      signal
    });
  }
  /**
   * AI Agent request (non-streaming)
   * Returns JSON response with text, steps, usage, and billing
   */
  async aiAgent(requestBody, signal) {
    return this.request(`/api/ai/${this.projectId}/agent`, {
      method: "POST",
      body: requestBody,
      signal
    });
  }
  /**
   * AI Agent streaming request
   * Returns raw Response for SSE streaming (compatible with AI SDK useChat)
   */
  async aiAgentStream(requestBody, signal) {
    const url = this.buildUrl(`/api/ai/${this.projectId}/agent`);
    const token = this.getValidToken ? await this.getValidToken() : this.getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    const auth = this.getAuthorizationHeader(url, token);
    if (auth) headers.Authorization = auth;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal
    });
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    return response;
  }
  /**
   * RAG AI Search streaming request
   * Returns raw Response for SSE streaming
   */
  async ragAiSearchStream(body, signal) {
    const url = this.buildUrl(`/api/rag/${this.projectId}/ai-search`);
    const token = this.getValidToken ? await this.getValidToken() : this.getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    const auth = this.getAuthorizationHeader(url, token);
    if (auth) headers.Authorization = auth;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal
    });
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    return response;
  }
  /**
   * Data-specific requests
   */
  async dataExtractFromUrl(projectId, request) {
    return this.request(`/api/data/${projectId}/extract-from-url`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }
  async dataExtractFromBlob(projectId, file, chunking, chunkSize) {
    const formData = new FormData();
    formData.append("file", file);
    if (chunking !== void 0) {
      formData.append("chunking", String(chunking));
    }
    if (chunkSize !== void 0) {
      formData.append("chunkSize", String(chunkSize));
    }
    return this.request(`/api/data/${projectId}/extract-from-blob`, {
      method: "POST",
      body: formData
    });
  }
  async dataScrape(projectId, request) {
    return this.request(`/api/data/${projectId}/scrape`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }
  async dataScreenshot(projectId, request) {
    return this.request(`/api/data/${projectId}/screenshot`, {
      method: "POST",
      body: JSON.stringify(request)
    });
  }
  async dataFetch(projectId, request) {
    return this.post(`/api/data/${projectId}/fetch`, request);
  }
  async dataSearch(projectId, request) {
    return this.post(`/api/data/${projectId}/search`, request);
  }
  /**
   * Connector requests
   */
  formatProviderForPath(provider) {
    return provider.replace("_", "-");
  }
  async connectorStatus(provider) {
    return this.request(`/api/connectors/${this.formatProviderForPath(provider)}/${this.projectId}/status`, {
      method: "GET"
    });
  }
  async connectorExecute(provider, request) {
    const path = request.method.startsWith("/") ? request.method : `/${request.method}`;
    const url = `/api/connectors/${this.formatProviderForPath(provider)}/${this.projectId}${path}`;
    const method = (request.http_method || "GET").toUpperCase();
    if (method === "GET") {
      return this.request(url, {
        method: "GET",
        searchParams: request.params
      });
    }
    return this.request(url, {
      method,
      body: request.params || {}
    });
  }
  async connectorSaveApiKey(provider, request) {
    return this.request(`/api/connectors/${this.formatProviderForPath(provider)}/${this.projectId}/api-key`, {
      method: "POST",
      body: request
    });
  }
  /**
   * Realtime-specific requests
   */
  async realtimePublish(projectId, request) {
    return this.post(`/api/realtime/${projectId}/publish`, request);
  }
  async realtimeGetPresence(projectId, channel) {
    return this.get(`/api/realtime/${projectId}/presence`, { channel });
  }
  async realtimeGetMessages(projectId, options) {
    const { channel, ...searchParams } = options;
    return this.get(`/api/realtime/${projectId}/messages`, {
      channel,
      ...Object.fromEntries(
        Object.entries(searchParams).filter(([k, v]) => v !== void 0).map(([k, v]) => [k, String(v)])
      )
    });
  }
  /**
   * Private helper methods
   */
  buildUrl(path, searchParams) {
    const baseUrl = path.includes("/api/auth/") ? this.authUrl : this.coreUrl;
    const url = new URL(path, baseUrl);
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }
  async parseResponse(response) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    if (contentType?.includes("text/")) {
      return response.text();
    }
    return response.blob();
  }
  async handleErrorResponse(response) {
    let errorData;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: "Unknown error occurred" };
    }
    const { message, code } = parseErrorBody(errorData, response.status);
    switch (response.status) {
      case 401:
        throw new BlinkAuthError(toAuthErrorCode(code), message, void 0, errorData);
      case 400:
        throw new BlinkValidationError(message, errorData, code);
      default:
        throw new BlinkNetworkError(message, response.status, errorData, code);
    }
  }
  /**
   * Parse Vercel AI SDK v5 Data Stream Protocol (Server-Sent Events)
   * Supports all event types from the UI Message Stream protocol
   */
  async parseDataStreamProtocol(body, onChunk) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const finalResult = {
      text: "",
      toolCalls: [],
      toolResults: [],
      sources: [],
      files: [],
      reasoning: []
    };
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          if (line === "[DONE]") {
            continue;
          }
          if (!line.startsWith("data: ")) continue;
          try {
            const jsonStr = line.slice(6);
            const part = JSON.parse(jsonStr);
            switch (part.type) {
              case "text-start":
                break;
              case "text-delta":
                if (part.delta) {
                  finalResult.text += part.delta;
                  if (onChunk) onChunk(part.delta);
                }
                if (part.textDelta) {
                  finalResult.text += part.textDelta;
                  if (onChunk) onChunk(part.textDelta);
                }
                break;
              case "text-end":
                break;
              case "tool-call":
                finalResult.toolCalls.push({
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  args: part.args
                });
                break;
              case "tool-result":
                finalResult.toolResults.push({
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  result: part.result
                });
                break;
              case "source-url":
                finalResult.sources.push({
                  id: part.id,
                  url: part.url,
                  title: part.title
                });
                break;
              case "file":
                finalResult.files.push(part.file);
                break;
              case "reasoning":
                finalResult.reasoning.push(part.content);
                break;
              case "finish":
                finalResult.finishReason = part.finishReason;
                finalResult.usage = part.usage;
                if (part.response) finalResult.response = part.response;
                break;
              case "error":
                finalResult.error = part.error;
                throw new Error(part.error);
              case "data":
                if (!finalResult.customData) finalResult.customData = [];
                finalResult.customData.push(part.value);
                break;
            }
          } catch (e) {
          }
        }
      }
      return finalResult;
    } finally {
      reader.releaseLock();
    }
  }
};
function hasWindow() {
  return typeof window !== "undefined";
}
function hasWindowLocation() {
  return typeof window !== "undefined" && typeof window.location !== "undefined";
}
function hasDocument() {
  return typeof document !== "undefined";
}
function isReactNative2() {
  return typeof navigator !== "undefined" && navigator.product === "ReactNative";
}
function getWindowLocation() {
  if (!hasWindow()) return null;
  try {
    return window.location;
  } catch {
    return null;
  }
}
function getLocationHref() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.href;
  } catch {
    return null;
  }
}
function getLocationOrigin() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.origin;
  } catch {
    return null;
  }
}
function getLocationHostname() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.hostname;
  } catch {
    return null;
  }
}
function getLocationPathname() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.pathname;
  } catch {
    return null;
  }
}
function getLocationSearch() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.search;
  } catch {
    return null;
  }
}
function getLocationHash() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.hash;
  } catch {
    return null;
  }
}
function getLocationProtocol() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.protocol;
  } catch {
    return null;
  }
}
function getLocationHost() {
  const loc = getWindowLocation();
  if (!loc) return null;
  try {
    return loc.host;
  } catch {
    return null;
  }
}
function constructFullUrl() {
  if (!hasWindow()) return null;
  const protocol = getLocationProtocol();
  const host = getLocationHost();
  const pathname = getLocationPathname();
  const search = getLocationSearch();
  const hash = getLocationHash();
  if (!protocol || !host) return null;
  return `${protocol}//${host}${pathname || ""}${search || ""}${hash || ""}`;
}
function getDocumentReferrer() {
  if (!hasDocument()) return null;
  try {
    return document.referrer || null;
  } catch {
    return null;
  }
}
function getWindowInnerWidth() {
  if (!hasWindow()) return null;
  try {
    return window.innerWidth;
  } catch {
    return null;
  }
}
function isIframe() {
  if (!hasWindow()) return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
function getSessionStorage() {
  if (!hasWindow()) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
var BlinkAuth = class {
  config;
  authConfig;
  authState;
  listeners = /* @__PURE__ */ new Set();
  authUrl;
  coreUrl;
  parentWindowTokens = null;
  isIframe = false;
  initializationPromise = null;
  isInitialized = false;
  storage;
  refreshPromise = null;
  constructor(config) {
    this.config = config;
    if (!config.projectId) {
      throw new Error("projectId is required for authentication");
    }
    this.authConfig = {
      mode: "managed",
      // Default mode
      authUrl: "https://blink.new",
      coreUrl: "https://core.blink.new",
      detectSessionInUrl: true,
      // Default to true for web compatibility
      ...config.auth
    };
    this.authUrl = this.authConfig.authUrl || "https://blink.new";
    this.coreUrl = this.authConfig.coreUrl || "https://core.blink.new";
    const hostname = getLocationHostname();
    if (hostname && this.authUrl === "https://blink.new" && (hostname === "localhost" || hostname === "127.0.0.1")) {
      console.warn("\u26A0\uFE0F Using default authUrl in development. Set auth.authUrl to your app origin for headless auth endpoints to work.");
    }
    if (config.authRequired !== void 0 && !config.auth?.mode) {
      this.authConfig.mode = config.authRequired ? "managed" : "headless";
    }
    this.authState = {
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false
    };
    this.storage = config.auth?.storage || config.storage || getDefaultStorageAdapter();
    if (isWeb) {
      this.isIframe = isIframe();
      this.setupParentWindowListener();
      this.setupCrossTabSync();
      this.initializationPromise = this.initialize();
    } else {
      this.isInitialized = true;
    }
  }
  /**
   * Generate project-scoped storage key
   */
  getStorageKey(suffix) {
    return `blink_${suffix}_${this.config.projectId}`;
  }
  /**
   * Migrate existing global tokens to project-scoped storage
   * DISABLED: We don't migrate global blink_tokens anymore because:
   * 1. Platform uses blink_tokens for platform auth (different user)
   * 2. Migrating platform tokens would cause project to show wrong user
   * 3. Projects should always authenticate fresh via their own flow
   */
  migrateExistingTokens() {
  }
  /**
   * Wait for authentication initialization to complete
   */
  async waitForInitialization() {
    if (this.isInitialized) return;
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }
  /**
   * Setup listener for tokens from parent window
   */
  setupParentWindowListener() {
    if (!isWeb || !this.isIframe || !hasWindow()) return;
    window.addEventListener("message", (event) => {
      if (event.origin !== "https://blink.new" && event.origin !== "http://localhost:3000" && event.origin !== "http://localhost:3001") {
        return;
      }
      if (event.data?.type === "BLINK_AUTH_TOKENS") {
        console.log("\u{1F4E5} Received auth tokens from parent window");
        const { tokens } = event.data;
        if (tokens) {
          this.parentWindowTokens = tokens;
          this.setTokens(tokens, false).then(() => {
            console.log("\u2705 Tokens from parent window applied");
          }).catch((error) => {
            console.error("Failed to apply parent window tokens:", error);
          });
        }
      }
      if (event.data?.type === "BLINK_AUTH_LOGOUT") {
        console.log("\u{1F4E4} Received logout command from parent window");
        this.clearTokens();
      }
    });
    if (hasWindow() && window.parent !== window) {
      console.log("\u{1F504} Requesting auth tokens from parent window");
      window.parent.postMessage({
        type: "BLINK_REQUEST_AUTH_TOKENS",
        projectId: this.config.projectId
      }, "*");
    }
  }
  /**
   * Initialize authentication from stored tokens or URL fragments
   */
  async initialize() {
    console.log("\u{1F680} Initializing Blink Auth...");
    this.setLoading(true);
    try {
      this.migrateExistingTokens();
      if (this.isIframe) {
        console.log("\u{1F50D} Detected iframe environment, waiting for parent tokens...");
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (this.parentWindowTokens) {
          console.log("\u2705 Using tokens from parent window");
          await this.setTokens(this.parentWindowTokens, false);
          return;
        }
      }
      if (this.authConfig.detectSessionInUrl !== false) {
        const tokensFromUrl = this.extractTokensFromUrl();
        if (tokensFromUrl) {
          console.log("\u{1F4E5} Found tokens in URL, setting them...");
          await this.setTokens(tokensFromUrl, true);
          this.clearUrlTokens();
          console.log("\u2705 Auth initialization complete (from URL)");
          return;
        }
      }
      const storedTokens = await this.getStoredTokens();
      if (storedTokens) {
        console.log("\u{1F4BE} Found stored tokens, validating...", {
          hasAccessToken: !!storedTokens.access_token,
          hasRefreshToken: !!storedTokens.refresh_token,
          issuedAt: storedTokens.issued_at,
          expiresIn: storedTokens.expires_in,
          refreshExpiresIn: storedTokens.refresh_expires_in,
          currentTime: Math.floor(Date.now() / 1e3)
        });
        this.authState.tokens = storedTokens;
        console.log("\u{1F527} Tokens set in auth state, refresh token available:", !!this.authState.tokens?.refresh_token);
        const isValid2 = await this.validateStoredTokens(storedTokens);
        if (isValid2) {
          console.log("\u2705 Auth initialization complete (from storage)");
          return;
        } else {
          console.log("\u{1F504} Stored tokens invalid, clearing...");
          this.clearTokens();
        }
      }
      console.log("\u274C No tokens found");
      if (this.config.authRequired && hasWindowLocation()) {
        console.log("\u{1F504} Auth required, redirecting to auth page...");
        this.redirectToAuth();
      } else {
        console.log("\u26A0\uFE0F Auth not required or no window.location, continuing without authentication");
      }
    } finally {
      this.setLoading(false);
      this.isInitialized = true;
    }
  }
  /**
   * Redirect to Blink auth page
   */
  login(nextUrl) {
    if (!hasWindowLocation()) {
      console.warn("login() called in non-browser environment (no window.location available)");
      return;
    }
    let redirectUrl = nextUrl || this.authConfig.redirectUrl;
    if (!redirectUrl) {
      const href = getLocationHref();
      if (href && href.startsWith("http")) {
        redirectUrl = href;
      } else {
        redirectUrl = constructFullUrl() || void 0;
      }
    }
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        url.searchParams.delete("redirect_url");
        url.searchParams.delete("redirect");
        redirectUrl = url.toString();
      } catch (e) {
        console.warn("Failed to parse redirect URL:", e);
      }
    }
    const authUrl = new URL("/auth", this.authUrl);
    authUrl.searchParams.set("redirect_url", redirectUrl || "");
    if (this.config.projectId) {
      authUrl.searchParams.set("project_id", this.config.projectId);
    }
    window.location.href = authUrl.toString();
  }
  /**
   * Logout and clear stored tokens
   */
  logout(redirectUrl) {
    this.clearTokens();
    if (redirectUrl && hasWindowLocation()) {
      window.location.href = redirectUrl;
    }
  }
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.authState.isAuthenticated;
  }
  /**
   * Get current user (sync)
   */
  currentUser() {
    return this.authState.user;
  }
  /**
   * Get current access token
   */
  getToken() {
    return this.authState.tokens?.access_token || null;
  }
  /**
   * Check if access token is expired based on timestamp
   */
  isAccessTokenExpired() {
    const tokens = this.authState.tokens;
    if (!tokens || !tokens.issued_at) {
      return true;
    }
    const now = Math.floor(Date.now() / 1e3);
    const expiresAt = tokens.issued_at + tokens.expires_in;
    const bufferTime = 30;
    return now >= expiresAt - bufferTime;
  }
  /**
   * Check if refresh token is expired based on timestamp
   */
  isRefreshTokenExpired() {
    const tokens = this.authState.tokens;
    if (!tokens || !tokens.refresh_token || !tokens.issued_at || !tokens.refresh_expires_in) {
      return true;
    }
    const now = Math.floor(Date.now() / 1e3);
    const expiresAt = tokens.issued_at + tokens.refresh_expires_in;
    return now >= expiresAt;
  }
  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken() {
    const tokens = this.authState.tokens;
    if (!tokens) {
      return null;
    }
    if (!this.isAccessTokenExpired()) {
      console.log("\u2705 Access token is still valid");
      return tokens.access_token;
    }
    console.log("\u23F0 Access token expired, attempting refresh...");
    if (this.isRefreshTokenExpired()) {
      console.log("\u274C Refresh token also expired, clearing tokens");
      this.clearTokens();
      if (this.config.authRequired) {
        this.redirectToAuth();
      }
      return null;
    }
    const refreshed = await this.refreshToken();
    if (refreshed) {
      console.log("\u2705 Token refreshed successfully");
      return this.authState.tokens?.access_token || null;
    } else {
      console.log("\u274C Token refresh failed");
      this.clearTokens();
      if (this.config.authRequired) {
        this.redirectToAuth();
      }
      return null;
    }
  }
  /**
   * Fetch current user profile from API
   * Gracefully waits for auth initialization to complete before throwing errors
   */
  async me() {
    await this.waitForInitialization();
    if (this.authState.isAuthenticated && this.authState.user) {
      return this.authState.user;
    }
    if (!this.authState.isAuthenticated) {
      return new Promise((resolve, reject) => {
        if (this.authState.user) {
          resolve(this.authState.user);
          return;
        }
        const timeout = setTimeout(() => {
          unsubscribe();
          reject(new BlinkAuthError("AUTH_TIMEOUT", "Authentication timeout - no user available"));
        }, 5e3);
        const unsubscribe = this.onAuthStateChanged((state) => {
          if (state.user) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(state.user);
          } else if (!state.isLoading && !state.isAuthenticated) {
            clearTimeout(timeout);
            unsubscribe();
            reject(new BlinkAuthError("INVALID_CREDENTIALS", "Not authenticated"));
          }
        });
      });
    }
    let token = this.getToken();
    if (!token) {
      throw new BlinkAuthError("TOKEN_EXPIRED", "No access token available");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            token = this.getToken();
            if (token) {
              const retryResponse = await fetch(`${this.authUrl}/api/auth/me`, {
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                const user2 = retryData.user;
                this.updateAuthState({
                  ...this.authState,
                  user: user2
                });
                return user2;
              }
            }
          }
          this.clearTokens();
          if (this.config.authRequired) {
            this.redirectToAuth();
          }
        }
        const errorData = await response.json().catch(() => ({}));
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || `Failed to fetch user: ${response.statusText}`);
      }
      const data = await response.json();
      const user = data.user;
      this.updateAuthState({
        ...this.authState,
        user
      });
      return user;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Sign up with email and password (headless mode)
   */
  async signUp(data) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signUp is only available in headless mode");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...data,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Sign up failed");
      }
      const result = await response.json();
      await this.setTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        refresh_expires_in: result.refresh_expires_in
      }, true, result.user);
      return result.user;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Sign in with email and password (headless mode)
   */
  async signInWithEmail(email, password) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signInWithEmail is only available in headless mode");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/signin/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Sign in failed");
      }
      const result = await response.json();
      await this.setTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        refresh_expires_in: result.refresh_expires_in
      }, true, result.user);
      return result.user;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Sign in with Google (headless mode)
   * 
   * **Universal OAuth** - Works on both Web and React Native!
   * 
   * On React Native, requires `webBrowser` to be configured in client:
   * ```typescript
   * const blink = createClient({
   *   auth: { mode: 'headless', webBrowser: WebBrowser }
   * })
   * await blink.auth.signInWithGoogle() // Works on both platforms!
   * ```
   */
  async signInWithGoogle(options) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signInWithGoogle is only available in headless mode");
    }
    return this.signInWithProvider("google", options);
  }
  /**
   * Sign in with GitHub (headless mode)
   * 
   * **Universal OAuth** - Works on both Web and React Native!
   * See signInWithGoogle() for setup instructions.
   */
  async signInWithGitHub(options) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signInWithGitHub is only available in headless mode");
    }
    return this.signInWithProvider("github", options);
  }
  /**
   * Sign in with Apple (headless mode)
   * 
   * **Universal OAuth** - Works on both Web and React Native!
   * See signInWithGoogle() for setup instructions.
   */
  async signInWithApple(options) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signInWithApple is only available in headless mode");
    }
    return this.signInWithProvider("apple", options);
  }
  /**
   * Sign in with Microsoft (headless mode)
   * 
   * **Universal OAuth** - Works on both Web and React Native!
   * See signInWithGoogle() for setup instructions.
   */
  async signInWithMicrosoft(options) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signInWithMicrosoft is only available in headless mode");
    }
    return this.signInWithProvider("microsoft", options);
  }
  /**
   * Initiate OAuth for mobile without deep linking (expo-web-browser pattern)
   * 
   * This method:
   * 1. Generates a unique session ID
   * 2. Returns OAuth URL with session parameter
   * 3. App opens URL in expo-web-browser
   * 4. App polls checkMobileOAuthSession() until complete
   * 
   * @param provider - OAuth provider (google, github, apple, etc.)
   * @param options - Optional metadata
   * @returns Session ID and OAuth URL
   * 
   * @example
   * // React Native with expo-web-browser
   * import * as WebBrowser from 'expo-web-browser';
   * 
   * const { sessionId, authUrl } = await blink.auth.initiateMobileOAuth('google');
   * 
   * // Open browser
   * await WebBrowser.openAuthSessionAsync(authUrl);
   * 
   * // Poll for completion
   * const user = await blink.auth.pollMobileOAuthSession(sessionId);
   * console.log('Authenticated:', user.email);
   */
  async initiateMobileOAuth(provider, options) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError(
        "INVALID_CREDENTIALS",
        "initiateMobileOAuth is only available in headless mode"
      );
    }
    const sessionId = this.generateSessionId();
    const authUrl = new URL("/auth", this.authUrl);
    authUrl.searchParams.set("provider", provider);
    authUrl.searchParams.set("project_id", this.config.projectId);
    authUrl.searchParams.set("mode", "mobile-session");
    authUrl.searchParams.set("session_id", sessionId);
    if (options?.metadata) {
      authUrl.searchParams.set("metadata", JSON.stringify(options.metadata));
    }
    return {
      sessionId,
      authUrl: authUrl.toString()
    };
  }
  /**
   * Check mobile OAuth session status (single check)
   * 
   * @param sessionId - Session ID from initiateMobileOAuth
   * @returns Tokens if session is complete, null if still pending
   */
  async checkMobileOAuthSession(sessionId) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/mobile-session/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 404 || response.status === 202) {
        return null;
      }
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(
          errorCode,
          errorData.error || "Failed to check OAuth session"
        );
      }
      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type || "Bearer",
        expires_in: data.expires_in || 3600,
        refresh_expires_in: data.refresh_expires_in
      };
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError(
        "NETWORK_ERROR",
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Poll mobile OAuth session until complete (convenience method)
   * 
   * @param sessionId - Session ID from initiateMobileOAuth
   * @param options - Polling options
   * @returns Authenticated user
   * 
   * @example
   * const { sessionId, authUrl } = await blink.auth.initiateMobileOAuth('google');
   * await WebBrowser.openAuthSessionAsync(authUrl);
   * const user = await blink.auth.pollMobileOAuthSession(sessionId, {
   *   maxAttempts: 60,
   *   intervalMs: 1000
   * });
   */
  async pollMobileOAuthSession(sessionId, options) {
    const maxAttempts = options?.maxAttempts || 60;
    const intervalMs = options?.intervalMs || 1e3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tokens = await this.checkMobileOAuthSession(sessionId);
      if (tokens) {
        await this.setTokens(tokens, true);
        return this.authState.user;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new BlinkAuthError(
      "AUTH_TIMEOUT",
      "Mobile OAuth session timed out"
    );
  }
  /**
   * Sign in with OAuth provider using expo-web-browser (React Native)
   * 
   * This is a convenience method that handles the entire flow:
   * 1. Initiates mobile OAuth session
   * 2. Returns auth URL to open in WebBrowser
   * 3. Provides polling function to call after browser opens
   * 
   * @param provider - OAuth provider
   * @returns Object with authUrl and authenticate function
   * 
   * @example
   * import * as WebBrowser from 'expo-web-browser';
   * 
   * const { authUrl, authenticate } = await blink.auth.signInWithProviderMobile('google');
   * 
   * // Open browser
   * await WebBrowser.openAuthSessionAsync(authUrl);
   * 
   * // Wait for authentication
   * const user = await authenticate();
   */
  async signInWithProviderMobile(provider, options) {
    const { sessionId, authUrl } = await this.initiateMobileOAuth(provider, options);
    return {
      authUrl,
      authenticate: () => this.pollMobileOAuthSession(sessionId, {
        maxAttempts: 60,
        intervalMs: 1e3
      })
    };
  }
  /**
   * Universal OAuth flow using session-based authentication (internal)
   * Works on ALL platforms: Web, iOS, Android
   * Uses expo-web-browser to open auth URL and polls for completion
   */
  async signInWithProviderUniversal(provider, options) {
    const webBrowser = this.authConfig.webBrowser;
    if (!webBrowser) {
      throw new BlinkAuthError(
        "NETWORK_ERROR",
        "webBrowser module is required for universal OAuth flow"
      );
    }
    const { sessionId, authUrl } = await this.initiateMobileOAuth(provider, options);
    console.log("\u{1F510} Opening OAuth browser for", provider);
    const browserPromise = webBrowser.openAuthSessionAsync(authUrl);
    const raceResult = await Promise.race([
      browserPromise.then((result) => ({ closed: true, result })).catch((err) => ({ closed: true, error: err })),
      new Promise(
        (resolve) => setTimeout(() => resolve({ closed: false }), 5e3)
      )
    ]);
    if (raceResult.closed) {
      if ("result" in raceResult) {
        console.log("\u{1F510} Browser closed with result:", raceResult.result.type);
      } else {
        console.log("\u{1F510} Browser closed with error");
      }
    } else {
      console.log("\u{1F510} Browser still open (new tab/stuck popup), starting to poll...");
    }
    const user = await this.pollMobileOAuthSession(sessionId, {
      maxAttempts: 120,
      // 60 seconds (give user time to complete auth)
      intervalMs: 500
    });
    console.log("\u2705 OAuth completed successfully");
    return user;
  }
  /**
   * Generic provider sign-in method (headless mode)
   * 
   * **Universal OAuth** - Works seamlessly on both Web and React Native!
   * 
   * When `webBrowser` is configured in the client, this method automatically
   * uses the session-based OAuth flow that works on ALL platforms.
   * 
   * **Universal Setup (configure once, works everywhere):**
   * ```typescript
   * import * as WebBrowser from 'expo-web-browser'
   * import AsyncStorage from '@react-native-async-storage/async-storage'
   * 
   * const blink = createClient({
   *   projectId: 'your-project',
   *   auth: {
   *     mode: 'headless',
   *     webBrowser: WebBrowser  // Pass the module here
   *   },
   *   storage: new AsyncStorageAdapter(AsyncStorage)
   * })
   * 
   * // Now this works on ALL platforms - no platform checks needed!
   * const user = await blink.auth.signInWithGoogle()
   * ```
   * 
   * @param provider - OAuth provider (google, github, apple, etc.)
   * @param options - Optional redirect URL and metadata
   * @returns Promise that resolves with authenticated user
   */
  async signInWithProvider(provider, options) {
    if (this.authConfig.mode !== "headless") {
      throw new BlinkAuthError("INVALID_CREDENTIALS", "signInWithProvider is only available in headless mode");
    }
    if (this.authConfig.webBrowser) {
      return this.signInWithProviderUniversal(provider, options);
    }
    if (isReactNative2()) {
      throw new BlinkAuthError(
        "NETWORK_ERROR",
        'React Native OAuth requires webBrowser in config!\n\nimport * as WebBrowser from "expo-web-browser";\n\nconst blink = createClient({\n  projectId: "your-project",\n  auth: {\n    mode: "headless",\n    webBrowser: WebBrowser\n  }\n})\n\nawait blink.auth.signInWithGoogle() // Works on all platforms!'
      );
    }
    if (!hasWindow()) {
      throw new BlinkAuthError("NETWORK_ERROR", "signInWithProvider requires a browser environment");
    }
    const shouldPreferRedirect = isWeb && this.isIframe || typeof window !== "undefined" && window.crossOriginIsolated === true;
    const state = this.generateState();
    try {
      const sessionStorage = getSessionStorage();
      if (sessionStorage) {
        sessionStorage.setItem("blink_oauth_state", state);
      }
    } catch {
    }
    const redirectUrl = options?.redirectUrl || getLocationOrigin() || "";
    const buildAuthUrl = (mode) => {
      const url = new URL("/auth", this.authUrl);
      url.searchParams.set("provider", provider);
      url.searchParams.set("project_id", this.config.projectId);
      url.searchParams.set("state", state);
      url.searchParams.set("mode", mode);
      url.searchParams.set("redirect_url", redirectUrl);
      url.searchParams.set("opener_origin", getLocationOrigin() || "");
      return url;
    };
    if (shouldPreferRedirect) {
      window.location.href = buildAuthUrl("redirect").toString();
      return new Promise(() => {
      });
    }
    return new Promise((resolve, reject) => {
      const popupUrl = buildAuthUrl("popup");
      const popup = window.open(
        popupUrl.toString(),
        "blink-auth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      if (!popup) {
        reject(new BlinkAuthError("POPUP_CANCELED", "Popup was blocked"));
        return;
      }
      let timeoutId;
      let closedIntervalId;
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        clearTimeout(timeoutId);
        if (closedIntervalId) clearInterval(closedIntervalId);
        window.removeEventListener("message", messageListener);
      };
      const messageListener = (event) => {
        let allowed = false;
        try {
          const authOrigin = new URL(this.authUrl).origin;
          if (event.origin === authOrigin) allowed = true;
        } catch {
        }
        if (event.origin === "http://localhost:3000" || event.origin === "http://localhost:3001") allowed = true;
        if (!allowed) return;
        if (event.data?.type === "BLINK_AUTH_TOKENS") {
          const { access_token, refresh_token, token_type, expires_in, refresh_expires_in, projectId, state: returnedState } = event.data;
          try {
            const sessionStorage = getSessionStorage();
            const expected = sessionStorage?.getItem("blink_oauth_state");
            if (returnedState && expected && returnedState !== expected) {
              reject(new BlinkAuthError("VERIFICATION_FAILED", "State mismatch"));
              clearTimeout(timeoutId);
              window.removeEventListener("message", messageListener);
              popup.close();
              return;
            }
          } catch {
          }
          if (projectId !== this.config.projectId) {
            reject(new BlinkAuthError("INVALID_CREDENTIALS", "Project ID mismatch"));
            return;
          }
          this.setTokens({
            access_token,
            refresh_token,
            token_type,
            expires_in,
            refresh_expires_in
          }, true).then(() => {
            resolve(this.authState.user);
          }).catch(reject);
          cleanup();
          popup.close();
        } else if (event.data?.type === "BLINK_AUTH_ERROR") {
          const errorCode = this.mapErrorCodeFromResponse(event.data.code);
          reject(new BlinkAuthError(errorCode, event.data.message || "Authentication failed"));
          cleanup();
          popup.close();
        }
      };
      if (popup.opener === null) {
        try {
          popup.close();
        } catch {
        }
        cleanup();
        window.location.href = buildAuthUrl("redirect").toString();
        return;
      }
      timeoutId = setTimeout(() => {
        cleanup();
        if (!popup.closed) {
          popup.close();
        }
        reject(new BlinkAuthError("AUTH_TIMEOUT", "Authentication timed out"));
      }, 3e5);
      closedIntervalId = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new BlinkAuthError("POPUP_CANCELED", "Authentication was canceled"));
        }
      }, 1e3);
      window.addEventListener("message", messageListener);
    });
  }
  /**
   * Generate password reset token (for custom email delivery)
   */
  async generatePasswordResetToken(email) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/password/reset/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(
          errorCode,
          errorData.error || "Failed to generate password reset token",
          errorData.error
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError(
        "NETWORK_ERROR",
        "Failed to generate password reset token",
        "Network error occurred"
      );
    }
  }
  /**
   * Send password reset email (using Blink default email service)
   */
  async sendPasswordResetEmail(email, options) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          projectId: this.config.projectId,
          redirectUrl: options?.redirectUrl
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Failed to send password reset email");
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(token, newPassword) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/password/reset/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password: newPassword,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Failed to reset password");
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Change password (requires current authentication)
   */
  async changePassword(oldPassword, newPassword) {
    const token = await this.getValidToken();
    if (!token) {
      throw new BlinkAuthError("TOKEN_EXPIRED", "No access token available");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/password/change`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Failed to change password");
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Permanently delete the signed-in user's own account.
   *
   * This is the ONLY correct way to delete an account: `blink.db` refuses POST/DELETE
   * on the `users` table, so a user row must never be deleted directly. The access
   * token is the only identity input, so a caller can delete only their own account.
   * On success the local session is cleared — `onAuthStateChanged` fires with
   * `user: null`, ending the session; the residual access token expires within ~15 min.
   *
   * Throws `BlinkAuthError` if the caller is signed out, blocked by the project owner,
   * or the account is already gone.
   */
  async deleteAccount() {
    const token = await this.getValidToken();
    if (!token) {
      throw new BlinkAuthError("TOKEN_EXPIRED", "No access token available");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/account`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.code ? this.mapErrorCodeFromResponse(errorData.code) : response.status === 404 ? "USER_NOT_FOUND" : response.status === 401 ? "TOKEN_EXPIRED" : "INVALID_CREDENTIALS";
        throw new BlinkAuthError(errorCode, errorData.error || `Failed to delete account: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    this.clearTokens();
  }
  /**
   * Generate email verification token (for custom email delivery)
   */
  async generateEmailVerificationToken() {
    const token = await this.getValidToken();
    if (!token) {
      throw new BlinkAuthError("TOKEN_EXPIRED", "No access token available");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/email/verify/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(
          errorCode,
          errorData.error || "Failed to generate email verification token",
          errorData.error
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError(
        "NETWORK_ERROR",
        "Failed to generate email verification token",
        "Network error occurred"
      );
    }
  }
  /**
   * Send email verification (using Blink default email service)
   */
  async sendEmailVerification() {
    const token = await this.getValidToken();
    if (!token) {
      throw new BlinkAuthError("TOKEN_EXPIRED", "No access token available");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/email/verify/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Failed to send verification email");
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/email/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Failed to verify email");
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Generate magic link token (for custom email delivery)
   */
  async generateMagicLinkToken(email, options) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/signin/magic/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          redirectUrl: options?.redirectUrl,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(
          errorCode,
          errorData.error || "Failed to generate magic link token",
          errorData.error
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError(
        "NETWORK_ERROR",
        "Failed to generate magic link token",
        "Network error occurred"
      );
    }
  }
  /**
   * Send magic link (using Blink default email service)
   */
  async sendMagicLink(email, options) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/signin/magic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          redirectUrl: options?.redirectUrl,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Failed to send magic link");
      }
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Verify magic link (automatic on redirect)
   */
  async verifyMagicLink(token) {
    const magicToken = token || this.extractMagicTokenFromUrl();
    if (!magicToken) {
      throw new BlinkAuthError("VERIFICATION_FAILED", "No magic link token found");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/signin/magic/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: magicToken,
          projectId: this.config.projectId
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || "Magic link verification failed");
      }
      const result = await response.json();
      await this.setTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        refresh_expires_in: result.refresh_expires_in
      }, true, result.user);
      return result.user;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Get available providers for the current project
   */
  async getAvailableProviders() {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/providers?projectId=${encodeURIComponent(this.config.projectId)}`);
      if (!response.ok) {
        return ["email", "google"];
      }
      const data = await response.json();
      return data.providers || ["email", "google"];
    } catch (error) {
      return ["email", "google"];
    }
  }
  /**
   * Check if user has a specific role
   */
  hasRole(role) {
    const user = this.authState.user;
    if (!user || !user.role) {
      return false;
    }
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }
  /**
   * Check if user can perform a specific action
   */
  can(permission, resource) {
    const user = this.authState.user;
    if (!user || !user.role) {
      return false;
    }
    const roles2 = this.authConfig.roles;
    if (!roles2) {
      return false;
    }
    const roleConfig = roles2[user.role];
    if (!roleConfig) {
      return false;
    }
    if (roleConfig.permissions.includes("*")) {
      return true;
    }
    const fullPermission = resource ? `${permission}.${resource}` : permission;
    if (roleConfig.permissions.includes(fullPermission)) {
      return true;
    }
    if (roleConfig.permissions.includes(permission)) {
      return true;
    }
    const visited = /* @__PURE__ */ new Set();
    const hasPermissionInRole = (roleName) => {
      if (visited.has(roleName)) return false;
      visited.add(roleName);
      const rc = roles2[roleName];
      if (!rc) return false;
      if (rc.permissions.includes("*")) return true;
      const fullPermission2 = resource ? `${permission}.${resource}` : permission;
      if (rc.permissions.includes(fullPermission2) || rc.permissions.includes(permission)) return true;
      if (rc.inherit) {
        for (const parent of rc.inherit) {
          if (hasPermissionInRole(parent)) return true;
        }
      }
      return false;
    };
    if (hasPermissionInRole(user.role)) return true;
    return false;
  }
  /**
   * Sign out (clear local tokens)
   * Note: With stateless tokens, this only clears local storage
   */
  async signOut() {
    this.clearTokens();
  }
  /**
   * @deprecated Use signOut() instead. Kept for backward compatibility.
   */
  async revokeAllSessions() {
    return this.signOut();
  }
  /**
   * Recover auth state (clear corrupted tokens and re-initialize)
   */
  async recoverAuthState() {
    console.log("\u{1F504} Recovering auth state...");
    this.clearTokens();
    this.isInitialized = false;
    this.initializationPromise = null;
    if (typeof window !== "undefined") {
      this.initializationPromise = this.initialize();
      await this.initializationPromise;
    }
    console.log("\u2705 Auth state recovery complete");
  }
  /**
   * Update user profile
   */
  async updateMe(updates) {
    const token = this.getToken();
    if (!token) {
      throw new BlinkAuthError("TOKEN_EXPIRED", "No access token available");
    }
    try {
      const response = await fetch(`${this.authUrl}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = this.mapErrorCodeFromResponse(errorData.code);
        throw new BlinkAuthError(errorCode, errorData.error || `Failed to update user: ${response.statusText}`);
      }
      const data = await response.json();
      const user = data.user;
      this.updateAuthState({
        ...this.authState,
        user
      });
      return user;
    } catch (error) {
      if (error instanceof BlinkAuthError) {
        throw error;
      }
      throw new BlinkAuthError("NETWORK_ERROR", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Manually set tokens (for server-side usage)
   */
  async setToken(jwt, persist = false) {
    const tokens = {
      access_token: jwt,
      token_type: "Bearer",
      expires_in: 15 * 60
      // Default 15 minutes
    };
    await this.setTokens(tokens, persist);
  }
  /**
   * Manually set auth session from tokens (React Native deep link OAuth)
   * 
   * Use this method to set the user session after receiving tokens from a deep link callback.
   * This is the React Native equivalent of automatic URL token detection on web.
   * 
   * @param tokens - Auth tokens received from deep link or OAuth callback
   * @param persist - Whether to persist tokens to storage (default: true)
   * 
   * @example
   * // React Native: Handle deep link OAuth callback
   * import * as Linking from 'expo-linking'
   * 
   * Linking.addEventListener('url', async ({ url }) => {
   *   const { queryParams } = Linking.parse(url)
   *   
   *   if (queryParams.access_token) {
   *     await blink.auth.setSession({
   *       access_token: queryParams.access_token,
   *       refresh_token: queryParams.refresh_token,
   *       expires_in: parseInt(queryParams.expires_in) || 3600,
   *       refresh_expires_in: parseInt(queryParams.refresh_expires_in)
   *     })
   *     
   *     console.log('User authenticated:', blink.auth.currentUser())
   *   }
   * })
   */
  async setSession(tokens, persist = true) {
    const authTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: "Bearer",
      expires_in: tokens.expires_in || 3600,
      // Default 1 hour
      refresh_expires_in: tokens.refresh_expires_in,
      issued_at: Math.floor(Date.now() / 1e3)
    };
    await this.setTokens(authTokens, persist);
    const user = await this.me();
    return user;
  }
  /**
   * Verify a Blink Auth token using the introspection endpoint.
   * 
   * **Server-side / Edge Function use only.**
   * 
   * This is the recommended way to verify user tokens in Deno Edge Functions
   * and other server-side contexts. It calls the Blink API introspection 
   * endpoint which validates the token without exposing the JWT secret.
   * 
   * @param token - The raw JWT token (without "Bearer " prefix) or full Authorization header
   * @returns Token introspection result with validity and claims
   * 
   * @example
   * // Deno Edge Function usage
   * import { createClient } from "npm:@blinkdotnew/sdk";
   * 
   * const blink = createClient({
   *   projectId: Deno.env.get("BLINK_PROJECT_ID")!,
   *   secretKey: Deno.env.get("BLINK_SECRET_KEY"),
   * });
   * 
   * async function handler(req: Request): Promise<Response> {
   *   const authHeader = req.headers.get("Authorization");
   *   const result = await blink.auth.verifyToken(authHeader);
   *   
   *   if (!result.valid) {
   *     return new Response(JSON.stringify({ error: result.error }), { status: 401 });
   *   }
   *   
   *   // User is authenticated
   *   console.log("User ID:", result.userId);
   *   console.log("Email:", result.email);
   *   console.log("Project:", result.projectId);
   *   
   *   // Continue with your logic...
   * }
   */
  async verifyToken(token) {
    if (!token) {
      return { valid: false, error: "Token required" };
    }
    let cleanToken = token.toLowerCase().startsWith("bearer ") ? token.slice(7) : token;
    cleanToken = cleanToken.trim();
    if (!cleanToken) {
      return { valid: false, error: "Token required" };
    }
    try {
      const response = await fetch(`${this.coreUrl}/api/auth/introspect`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        }
      });
      const contentType = response.headers.get("content-type")?.toLowerCase();
      if (!contentType || !contentType.includes("application/json")) {
        return {
          valid: false,
          error: `Server error: ${response.status} ${response.statusText}`
        };
      }
      const result = await response.json();
      if (!result || typeof result !== "object" || typeof result.valid !== "boolean") {
        return {
          valid: false,
          error: result && (result.error || result.message) || `Request failed: ${response.status}`
        };
      }
      return result;
    } catch (error) {
      console.error("[BlinkAuth] Token verification failed:", error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Token verification failed"
      };
    }
  }
  /**
   * Refresh access token using refresh token
   */
  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    const refreshToken = this.authState.tokens?.refresh_token;
    if (!refreshToken) {
      return false;
    }
    this.refreshPromise = this.performTokenRefresh(refreshToken);
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
  /**
   * Force a server-side token refresh and return the resulting access token.
   *
   * Used by the HTTP client to recover from a 401 even when the client-side
   * expiry heuristics believe the access token is still valid (clock skew, a
   * restored session with a stale `issued_at`, or a refresh race). Delegates to
   * {@link refreshToken} so it shares the single-flight guard.
   *
   * @returns The new access token, or null if refresh was not possible.
   */
  async forceRefreshAccessToken() {
    const refreshed = await this.refreshToken();
    return refreshed ? this.authState.tokens?.access_token || null : null;
  }
  async performTokenRefresh(refreshToken) {
    try {
      const response = await fetch(`${this.authUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });
      if (!response.ok) {
        if (response.status === 401) {
          this.clearTokens();
          if (this.config.authRequired) {
            this.redirectToAuth();
          }
        }
        return false;
      }
      const data = await response.json();
      await this.setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_expires_in: data.refresh_expires_in
      }, true);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }
  /**
   * Add auth state change listener
   */
  onAuthStateChanged(callback) {
    this.listeners.add(callback);
    queueMicrotask(() => {
      try {
        callback(this.authState);
      } catch (error) {
        console.error("Error in auth state change callback:", error);
      }
    });
    return () => {
      this.listeners.delete(callback);
    };
  }
  /**
   * Private helper methods
   */
  async validateStoredTokens(tokens) {
    try {
      console.log("\u{1F50D} Validating stored tokens...");
      if (this.isAccessTokenExpired()) {
        console.log("\u23F0 Access token expired based on timestamp, attempting refresh...");
        if (!tokens.refresh_token) {
          console.log("\u274C No refresh token available");
          return false;
        }
        if (this.isRefreshTokenExpired()) {
          console.log("\u274C Refresh token also expired");
          return false;
        }
        const refreshed = await this.refreshToken();
        if (refreshed) {
          console.log("\u2705 Token refreshed successfully during validation");
          return true;
        } else {
          console.log("\u274C Token refresh failed during validation");
          return false;
        }
      }
      const response = await fetch(`${this.authUrl}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        this.updateAuthState({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false
        });
        console.log("\u2705 Stored tokens are valid, user authenticated");
        return true;
      } else if (response.status === 401 && tokens.refresh_token) {
        console.log("\u{1F504} Access token expired (server validation), attempting refresh...");
        if (this.isRefreshTokenExpired()) {
          console.log("\u274C Refresh token expired");
          return false;
        }
        const refreshed = await this.refreshToken();
        if (refreshed) {
          console.log("\u2705 Token refreshed successfully after server validation");
          return true;
        } else {
          console.log("\u274C Token refresh failed after server validation");
          return false;
        }
      } else {
        console.log("\u274C Token validation failed:", response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.log("\u{1F4A5} Error validating tokens:", error);
      return false;
    }
  }
  async setTokens(tokens, persist, knownUser) {
    const tokensWithTimestamp = {
      ...tokens,
      issued_at: tokens.issued_at || Math.floor(Date.now() / 1e3)
    };
    console.log("\u{1F510} Setting tokens:", {
      persist,
      hasAccessToken: !!tokensWithTimestamp.access_token,
      hasRefreshToken: !!tokensWithTimestamp.refresh_token,
      expiresIn: tokensWithTimestamp.expires_in,
      issuedAt: tokensWithTimestamp.issued_at,
      hasKnownUser: !!knownUser
    });
    if (persist) {
      try {
        const result = this.storage.setItem(
          this.getStorageKey("tokens"),
          JSON.stringify(tokensWithTimestamp)
        );
        if (result instanceof Promise) {
          await result;
        }
        console.log("\u{1F4BE} Tokens persisted to storage");
      } catch (error) {
        console.log("\u{1F4A5} Error persisting tokens:", error);
      }
    }
    let user = knownUser || null;
    if (!user) {
      try {
        console.log("\u{1F464} Fetching user data...");
        const response = await fetch(`${this.authUrl}/api/auth/me`, {
          headers: {
            "Authorization": `Bearer ${tokensWithTimestamp.access_token}`
          }
        });
        console.log("\u{1F4E1} User fetch response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        if (response.ok) {
          const data = await response.json();
          user = data.user;
          console.log("\u2705 User data fetched successfully:", {
            id: user?.id,
            email: user?.email,
            displayName: user?.displayName
          });
        } else {
          console.log("\u274C Failed to fetch user data:", await response.text());
        }
      } catch (error) {
        console.log("\u{1F4A5} Error fetching user data:", error);
      }
    } else {
      console.log("\u2705 Using known user data (skipping /api/auth/me):", {
        id: user?.id,
        email: user?.email
      });
    }
    this.updateAuthState({
      user,
      tokens: tokensWithTimestamp,
      isAuthenticated: !!user,
      isLoading: false
    });
    console.log("\u{1F3AF} Auth state updated:", {
      hasUser: !!user,
      isAuthenticated: !!user,
      isLoading: false
    });
  }
  clearTokens() {
    try {
      const result = this.storage.removeItem(this.getStorageKey("tokens"));
      if (result instanceof Promise) {
        result.catch((error) => {
          console.log("\u{1F4A5} Error clearing tokens from storage:", error);
        });
      }
    } catch (error) {
      console.log("\u{1F4A5} Error clearing tokens:", error);
    }
    this.updateAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false
    });
  }
  async getStoredTokens() {
    if (isWeb && this.isIframe && this.parentWindowTokens) {
      return this.parentWindowTokens;
    }
    try {
      const result = this.storage.getItem(this.getStorageKey("tokens"));
      const stored = result instanceof Promise ? await result : result;
      console.log("\u{1F50D} Checking storage for tokens:", {
        hasStoredData: !!stored,
        storedLength: stored?.length || 0,
        isIframe: isWeb && this.isIframe
      });
      if (stored) {
        const tokens = JSON.parse(stored);
        console.log("\u{1F4E6} Parsed stored tokens:", {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in
        });
        return tokens;
      }
      return null;
    } catch (error) {
      console.log("\u{1F4A5} Error reading tokens from storage:", error);
      return null;
    }
  }
  extractTokensFromUrl() {
    const search = getLocationSearch();
    if (!search) return null;
    const params = new URLSearchParams(search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    console.log("\u{1F50D} Extracting tokens from URL:", {
      url: getLocationHref(),
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
      allParams: Object.fromEntries(params.entries())
    });
    if (accessToken) {
      const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken || void 0,
        token_type: "Bearer",
        expires_in: 15 * 60,
        // 15 minutes default
        refresh_expires_in: refreshToken ? 30 * 24 * 60 * 60 : void 0,
        // 30 days default
        issued_at: Math.floor(Date.now() / 1e3)
        // Current timestamp
      };
      console.log("\u2705 Tokens extracted successfully:", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token
      });
      return tokens;
    }
    console.log("\u274C No access token found in URL");
    return null;
  }
  clearUrlTokens() {
    const href = getLocationHref();
    if (!href || !hasWindowLocation()) return;
    const url = new URL(href);
    url.searchParams.delete("access_token");
    url.searchParams.delete("refresh_token");
    url.searchParams.delete("token_type");
    url.searchParams.delete("project_id");
    url.searchParams.delete("expires_in");
    url.searchParams.delete("refresh_expires_in");
    url.searchParams.delete("state");
    url.searchParams.delete("code");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, "", url.toString());
    console.log("\u{1F9F9} URL cleaned up, removed auth parameters");
  }
  redirectToAuth() {
    if (hasWindowLocation()) {
      this.login();
    }
  }
  setLoading(loading) {
    this.updateAuthState({
      ...this.authState,
      isLoading: loading
    });
  }
  updateAuthState(newState) {
    this.authState = newState;
    this.listeners.forEach((callback) => {
      try {
        callback(newState);
      } catch (error) {
        console.error("Error in auth state change callback:", error);
      }
    });
  }
  /**
   * Generate secure random state for OAuth flows
   */
  generateState() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    } else {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  }
  /**
   * Generate unique session ID for mobile OAuth
   */
  generateSessionId() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    } else {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  }
  /**
   * Extract magic link token from URL
   */
  extractMagicTokenFromUrl() {
    const search = getLocationSearch();
    if (!search) return null;
    const params = new URLSearchParams(search);
    return params.get("magic_token") || params.get("token");
  }
  /**
   * Map server error codes to BlinkAuthErrorCode
   */
  mapErrorCodeFromResponse(serverCode) {
    switch (serverCode) {
      case "INVALID_CREDENTIALS":
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "INVALID_CREDENTIALS";
      case "EMAIL_NOT_VERIFIED":
      case "auth/email-not-verified":
        return "EMAIL_NOT_VERIFIED";
      case "EMAIL_ALREADY_VERIFIED":
        return "VERIFICATION_FAILED";
      case "POPUP_CANCELED":
      case "auth/popup-closed-by-user":
        return "POPUP_CANCELED";
      case "NETWORK_ERROR":
        return "NETWORK_ERROR";
      case "RATE_LIMITED":
      case "auth/too-many-requests":
        return "RATE_LIMITED";
      case "AUTH_TIMEOUT":
        return "AUTH_TIMEOUT";
      case "REDIRECT_FAILED":
        return "REDIRECT_FAILED";
      case "TOKEN_EXPIRED":
      case "auth/id-token-expired":
        return "TOKEN_EXPIRED";
      case "USER_NOT_FOUND":
        return "USER_NOT_FOUND";
      case "EMAIL_ALREADY_EXISTS":
      case "auth/email-already-in-use":
        return "EMAIL_ALREADY_EXISTS";
      case "WEAK_PASSWORD":
      case "auth/weak-password":
        return "WEAK_PASSWORD";
      case "INVALID_EMAIL":
      case "auth/invalid-email":
        return "INVALID_EMAIL";
      case "MAGIC_LINK_EXPIRED":
        return "MAGIC_LINK_EXPIRED";
      case "VERIFICATION_FAILED":
        return "VERIFICATION_FAILED";
      default:
        return "NETWORK_ERROR";
    }
  }
  /**
   * Setup cross-tab authentication synchronization
   */
  setupCrossTabSync() {
    if (!isWeb || !hasWindow()) return;
    window.addEventListener("storage", (e) => {
      if (e.key === this.getStorageKey("tokens")) {
        const newTokens = e.newValue ? JSON.parse(e.newValue) : null;
        if (newTokens && newTokens !== this.authState.tokens) {
          this.setTokens(newTokens, false).catch((error) => {
            console.error("Failed to sync tokens from other tab:", error);
          });
        } else if (!newTokens && this.authState.tokens) {
          this.clearTokens();
        }
      }
    });
  }
};
function assertServerOnly(methodName) {
  if (typeof window !== "undefined") {
    throw new Error(`${methodName} is server-only. Use Blink CRUD methods (blink.db.<table>.*) instead.`);
  }
}
function camelToSnake3(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function generateSecureId() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } else {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const extraRandom = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${randomPart}_${extraRandom}`;
  }
}
function ensureRecordId(record) {
  if (!record.id) {
    return { ...record, id: generateSecureId() };
  }
  return record;
}
var BlinkTable = class {
  constructor(tableName, httpClient) {
    this.tableName = tableName;
    this.httpClient = httpClient;
    this.actualTableName = camelToSnake3(tableName);
  }
  actualTableName;
  /**
   * Create a single record
   */
  async create(data, options = {}) {
    const record = ensureRecordId(data);
    const response = await this.httpClient.dbPost(
      this.actualTableName,
      record,
      { returning: options.returning !== false }
    );
    const result = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!result) {
      throw new Error("Failed to create record");
    }
    return result;
  }
  /**
   * Create multiple records
   */
  async createMany(data, options = {}) {
    const records = data.map(ensureRecordId);
    const response = await this.httpClient.dbPost(
      this.actualTableName,
      records,
      { returning: options.returning !== false }
    );
    const results = Array.isArray(response.data) ? response.data : [response.data];
    return results;
  }
  /**
   * Upsert a single record (insert or update on conflict)
   */
  async upsert(data, options = {}) {
    const record = ensureRecordId(data);
    const onConflict = options.onConflict || "id";
    const response = await this.httpClient.dbUpsert(
      this.actualTableName,
      record,
      { onConflict, returning: options.returning !== false }
    );
    const result = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!result) {
      throw new Error("Failed to upsert record");
    }
    return result;
  }
  /**
   * Upsert multiple records
   */
  async upsertMany(data, options = {}) {
    const records = data.map(ensureRecordId);
    const onConflict = options.onConflict || "id";
    const response = await this.httpClient.dbUpsert(
      this.actualTableName,
      records,
      { onConflict, returning: options.returning !== false }
    );
    const results = Array.isArray(response.data) ? response.data : [response.data];
    return results;
  }
  /**
   * Get a single record by ID
   */
  async get(id) {
    const searchParams = {
      id: `eq.${id}`,
      limit: "1"
    };
    const response = await this.httpClient.dbGet(this.actualTableName, searchParams);
    const records = response.data;
    if (records.length === 0) {
      return null;
    }
    return records[0] || null;
  }
  /**
   * List records with filtering, sorting, and pagination
   */
  async list(options = {}) {
    const queryParams = buildQuery(options);
    const searchParams = queryParams;
    const response = await this.httpClient.dbGet(this.actualTableName, searchParams);
    const records = response.data;
    return records;
  }
  /**
   * Update a single record by ID
   */
  async update(id, data, options = {}) {
    const searchParams = {
      id: `eq.${id}`
    };
    const response = await this.httpClient.dbPatch(
      this.actualTableName,
      data,
      searchParams,
      { returning: options.returning !== false }
    );
    const records = response.data;
    if (!records || records.length === 0) {
      throw new Error(`Record with id ${id} not found`);
    }
    return records[0];
  }
  /**
   * Update multiple records
   */
  async updateMany(updates, options = {}) {
    const results = [];
    for (const update of updates) {
      const { id, ...data } = update;
      const result = await this.update(id, data, options);
      results.push(result);
    }
    return results;
  }
  /**
   * Delete a single record by ID
   */
  async delete(id) {
    const searchParams = {
      id: `eq.${id}`
    };
    await this.httpClient.dbDelete(this.actualTableName, searchParams);
  }
  /**
   * Delete multiple records based on filter
   */
  async deleteMany(options) {
    const queryParams = buildQuery({ where: options.where });
    const searchParams = queryParams;
    await this.httpClient.dbDelete(this.actualTableName, searchParams);
  }
  /**
   * Count records matching filter
   */
  async count(options = {}) {
    const queryParams = buildQuery({
      where: options.where,
      select: ["id"]
    });
    const response = await this.httpClient.request(
      `/api/db/${this.httpClient.projectId}/rest/v1/${this.actualTableName}`,
      {
        method: "GET",
        searchParams: queryParams,
        headers: {
          "Prefer": "count=exact"
        }
      }
    );
    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      const match2 = contentRange.match(/\/(\d+)$/);
      if (match2 && match2[1]) {
        return parseInt(match2[1], 10);
      }
    }
    const records = response.data;
    return records.length;
  }
  /**
   * Check if any records exist matching filter
   */
  async exists(options) {
    const count = await this.count(options);
    return count > 0;
  }
  /**
   * Raw SQL query on this table (for advanced use cases)
   */
  async sql(query, params) {
    assertServerOnly("blink.db.<table>.sql");
    const response = await this.httpClient.dbSql(query, params);
    return response.data;
  }
  /**
   * Private helper methods
   */
  extractCursor(record) {
    return record.id || record._id || String(Math.random());
  }
};
var BlinkDatabase = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
    const proxy = new Proxy(this, {
      get(target, prop) {
        if (prop === "table") {
          return target.table.bind(target);
        }
        if (prop in target) {
          const value = target[prop];
          return typeof value === "function" ? value.bind(target) : value;
        }
        if (typeof prop === "string") {
          return target.table(prop);
        }
        return void 0;
      }
    });
    return proxy;
  }
  tables = /* @__PURE__ */ new Map();
  /**
   * Get a table instance for any table name
   */
  table(tableName) {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, new BlinkTable(tableName, this.httpClient));
    }
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }
    return table;
  }
  /**
   * Execute raw SQL query
   */
  async sql(query, params) {
    assertServerOnly("blink.db.sql");
    const response = await this.httpClient.dbSql(query, params);
    return response.data;
  }
  /**
   * Execute batch SQL operations
   */
  async batch(statements2, mode = "write") {
    assertServerOnly("blink.db.batch");
    const response = await this.httpClient.dbBatch(statements2, mode);
    return response.data;
  }
};
var BlinkStorageImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * Upload a file to project storage
   *
   * @param file - File, Blob, Buffer, ArrayBuffer, or a React Native file
   *   descriptor (`{ uri, name?, type? }`) to upload
   * @param path - Destination path within project storage (extension will be auto-corrected to match file type)
   * @param options - Upload options including upsert and progress callback
   * @returns Promise resolving to upload response with public URL
   *
   * @example
   * ```ts
   * // Extension automatically corrected to match actual file type
   * const { publicUrl } = await blink.storage.upload(
   *   pngFile,
   *   `avatars/${user.id}`, // No extension needed!
   *   { upsert: true }
   * );
   * // If file is PNG, final path will be: avatars/user123.png
   *
   * // React Native / Expo: pass the picker/camera result's uri directly.
   * // Do NOT wrap it in a Blob — that uploads a 0-byte file on RN.
   * const { publicUrl } = await blink.storage.upload(
   *   { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' },
   *   `corrections/${id}`
   * );
   *
   * // Or with extension (will be corrected if wrong)
   * const { publicUrl } = await blink.storage.upload(
   *   pngFile,
   *   `avatars/${user.id}.jpg`, // Wrong extension
   *   { upsert: true }
   * );
   * // Final path will be: avatars/user123.png (auto-corrected!)
   * ```
   */
  async upload(file, path, options = {}) {
    try {
      if (!file) {
        throw new BlinkStorageError("File is required");
      }
      if (!path || typeof path !== "string" || !path.trim()) {
        throw new BlinkStorageError("Path must be a non-empty string");
      }
      const maxSize = 50 * 1024 * 1024;
      let fileSize = 0;
      if (typeof File !== "undefined" && file instanceof File) {
        fileSize = file.size;
      } else if (typeof Blob !== "undefined" && file instanceof Blob) {
        fileSize = file.size;
      } else if (file instanceof ArrayBuffer) {
        fileSize = file.byteLength;
      } else if (typeof Buffer !== "undefined" && file instanceof Buffer) {
        fileSize = file.length;
      }
      if (fileSize > maxSize) {
        throw new BlinkStorageError(`File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
      }
      const { correctedPath, detectedContentType } = await this.detectFileTypeAndCorrectPath(file, path);
      const response = await this.httpClient.uploadFile(
        `/api/storage/${this.httpClient.projectId}/upload`,
        file,
        correctedPath,
        // Use corrected path with proper extension
        {
          onProgress: options.onProgress,
          contentType: detectedContentType
          // Pass detected content type
        }
      );
      if (response.data?.data?.publicUrl) {
        return { publicUrl: response.data.data.publicUrl };
      } else if (response.data?.publicUrl) {
        return { publicUrl: response.data.publicUrl };
      } else {
        throw new BlinkStorageError("Invalid response format: missing publicUrl");
      }
    } catch (error) {
      if (error instanceof BlinkStorageError) {
        throw error;
      }
      if (error instanceof Error && "status" in error) {
        const status = error.status;
        if (status === 409) {
          throw new BlinkStorageError("File already exists.", 409, { originalError: error }, upstreamCode(error));
        }
        if (status === 400) {
          throw new BlinkStorageError("Invalid request parameters", 400, { originalError: error }, upstreamCode(error));
        }
      }
      throw new BlinkStorageError(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Detect file type from actual file content and correct path extension
   * This ensures the path extension always matches the actual file type
   */
  async detectFileTypeAndCorrectPath(file, originalPath) {
    try {
      let detectedContentType = "";
      let detectedExtension = "";
      if (isReactNativeFile(file)) {
        detectedContentType = file.type || "";
        const mimeExt = detectedContentType ? this.getExtensionFromMimeType(detectedContentType) : "";
        detectedExtension = (mimeExt && mimeExt !== "bin" ? mimeExt : "") || this.getExtensionFromName(file.name) || this.getExtensionFromName(file.uri) || this.getExtensionFromName(originalPath);
      } else {
        const fileSignature = await this.getFileSignature(file);
        const detectedType = this.detectFileTypeFromSignature(fileSignature);
        detectedContentType = detectedType.mimeType;
        detectedExtension = detectedType.extension;
        if (!detectedContentType && typeof File !== "undefined" && file instanceof File && file.type) {
          detectedContentType = file.type;
          detectedExtension = this.getExtensionFromMimeType(file.type);
        }
      }
      if (!detectedContentType) {
        detectedContentType = "application/octet-stream";
      }
      if (!detectedExtension) {
        detectedExtension = "bin";
      }
      return {
        correctedPath: this.rebuildPathWithExtension(originalPath, detectedExtension),
        detectedContentType
      };
    } catch (error) {
      return {
        correctedPath: originalPath,
        detectedContentType: "application/octet-stream"
      };
    }
  }
  /**
   * Replace (or append) the extension on the last path segment.
   */
  rebuildPathWithExtension(originalPath, extension) {
    const pathParts = originalPath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const directory = pathParts.slice(0, -1).join("/");
    if (!fileName) {
      throw new Error("Invalid path: filename cannot be empty");
    }
    const nameWithoutExt = fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
    const correctedFileName = `${nameWithoutExt}.${extension}`;
    return directory ? `${directory}/${correctedFileName}` : correctedFileName;
  }
  /**
   * Pull a lowercase extension out of a filename, path, or uri (no dot, '' if
   * none). Strips any query/fragment (RN content:// uris carry them) and only
   * accepts a sane extension so junk never leaks into the storage path.
   */
  getExtensionFromName(name) {
    if (!name) return "";
    const base = (name.split(/[?#]/)[0] || "").split("/").pop() || "";
    const dot = base.lastIndexOf(".");
    if (dot <= 0) return "";
    const ext = base.substring(dot + 1).toLowerCase();
    return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "";
  }
  /**
   * Get the first few bytes of a file to analyze its signature
   */
  async getFileSignature(file) {
    const bytesToRead = 12;
    if (file instanceof ArrayBuffer) {
      return new Uint8Array(file.slice(0, bytesToRead));
    }
    if (typeof Buffer !== "undefined" && file instanceof Buffer) {
      return new Uint8Array(file.slice(0, bytesToRead));
    }
    if (typeof File !== "undefined" && file instanceof File || typeof Blob !== "undefined" && file instanceof Blob) {
      const slice = file.slice(0, bytesToRead);
      const arrayBuffer = await slice.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    throw new Error("Unsupported file type for signature detection");
  }
  /**
   * Detect file type from file signature (magic numbers)
   * This is the most reliable way to detect actual file type
   */
  detectFileTypeFromSignature(signature) {
    const hex = Array.from(signature).map((b) => b.toString(16).padStart(2, "0")).join("");
    const signatures = {
      // Images
      "ffd8ff": { mimeType: "image/jpeg", extension: "jpg" },
      "89504e47": { mimeType: "image/png", extension: "png" },
      "47494638": { mimeType: "image/gif", extension: "gif" },
      "52494646": { mimeType: "image/webp", extension: "webp" },
      // RIFF (WebP container)
      "424d": { mimeType: "image/bmp", extension: "bmp" },
      "49492a00": { mimeType: "image/tiff", extension: "tiff" },
      "4d4d002a": { mimeType: "image/tiff", extension: "tiff" },
      // Documents
      "25504446": { mimeType: "application/pdf", extension: "pdf" },
      "504b0304": { mimeType: "application/zip", extension: "zip" },
      // Also used by docx, xlsx
      "d0cf11e0": { mimeType: "application/msword", extension: "doc" },
      // Audio
      "494433": { mimeType: "audio/mpeg", extension: "mp3" },
      "664c6143": { mimeType: "audio/flac", extension: "flac" },
      "4f676753": { mimeType: "audio/ogg", extension: "ogg" },
      // Video
      "000000": { mimeType: "video/mp4", extension: "mp4" },
      // ftyp box
      "1a45dfa3": { mimeType: "video/webm", extension: "webm" },
      // Text
      "efbbbf": { mimeType: "text/plain", extension: "txt" }
      // UTF-8 BOM
    };
    for (const [sig, type] of Object.entries(signatures)) {
      if (hex.startsWith(sig)) {
        return type;
      }
    }
    if (hex.startsWith("52494646") && hex.substring(16, 24) === "57454250") {
      return { mimeType: "image/webp", extension: "webp" };
    }
    if (hex.substring(8, 16) === "66747970") {
      return { mimeType: "video/mp4", extension: "mp4" };
    }
    return { mimeType: "", extension: "" };
  }
  /**
   * Get file extension from MIME type as fallback
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/bmp": "bmp",
      "image/svg+xml": "svg",
      "application/pdf": "pdf",
      "text/plain": "txt",
      "text/html": "html",
      "text/css": "css",
      "application/javascript": "js",
      "application/json": "json",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "application/zip": "zip"
    };
    return mimeToExt[mimeType] || "bin";
  }
  /**
   * Get a download URL for a file that triggers browser download
   * 
   * @param path - Path to the file in project storage
   * @param options - Download options including custom filename
   * @returns Promise resolving to download response with download URL
   * 
   * @example
   * ```ts
   * // Download with original filename
   * const { downloadUrl, filename } = await blink.storage.download('images/photo.jpg');
   * window.open(downloadUrl, '_blank');
   * 
   * // Download with custom filename
   * const { downloadUrl } = await blink.storage.download(
   *   'images/photo.jpg',
   *   { filename: 'my-photo.jpg' }
   * );
   * 
   * // Create download link in React
   * <a href={downloadUrl} download={filename}>Download Image</a>
   * ```
   */
  async download(path, options = {}) {
    try {
      if (!path || typeof path !== "string" || !path.trim()) {
        throw new BlinkStorageError("Path must be a non-empty string");
      }
      const response = await this.httpClient.request(
        `/api/storage/${this.httpClient.projectId}/download`,
        {
          method: "GET",
          searchParams: {
            path: path.trim(),
            ...options.filename && { filename: options.filename }
          }
        }
      );
      if (response.data?.downloadUrl) {
        return {
          downloadUrl: response.data.downloadUrl,
          filename: response.data.filename || options.filename || path.split("/").pop() || "download",
          contentType: response.data.contentType,
          size: response.data.size
        };
      } else {
        throw new BlinkStorageError("Invalid response format: missing downloadUrl");
      }
    } catch (error) {
      if (error instanceof BlinkStorageError) {
        throw error;
      }
      if (error instanceof Error && "status" in error) {
        const status = error.status;
        if (status === 404) {
          throw new BlinkStorageError("File not found", 404, { originalError: error }, upstreamCode(error));
        }
        if (status === 400) {
          throw new BlinkStorageError("Invalid request parameters", 400, { originalError: error }, upstreamCode(error));
        }
      }
      throw new BlinkStorageError(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Remove one or more files from project storage
   * 
   * @param paths - File paths to remove
   * @returns Promise that resolves when files are removed
   * 
   * @example
   * ```ts
   * await blink.storage.remove('avatars/user1.png');
   * await blink.storage.remove('file1.pdf', 'file2.pdf', 'file3.pdf');
   * ```
   */
  async remove(...paths) {
    try {
      if (paths.length === 0) {
        throw new BlinkStorageError("At least one path must be provided");
      }
      for (const path of paths) {
        if (!path || typeof path !== "string") {
          throw new BlinkStorageError("All paths must be non-empty strings");
        }
      }
      await this.httpClient.request(
        `/api/storage/${this.httpClient.projectId}/remove`,
        {
          method: "DELETE",
          body: { paths },
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      if (error instanceof BlinkStorageError) {
        throw error;
      }
      if (error instanceof Error && "status" in error) {
        const status = error.status;
        if (status === 400) {
          throw new BlinkStorageError("Invalid request parameters", 400, { originalError: error }, upstreamCode(error));
        }
      }
      throw new BlinkStorageError(
        `Failed to remove files: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
};
function serializeTools(tools) {
  return tools;
}
function createStopConditions(maxSteps, stopWhen) {
  if (stopWhen && stopWhen.length > 0) {
    return stopWhen;
  }
  if (maxSteps && maxSteps > 0) {
    return [{ type: "step_count_is", count: maxSteps }];
  }
  return void 0;
}
var Agent = class {
  httpClient = null;
  config;
  /**
   * Create a new Agent instance.
   * Auto-binds to default client if createClient() was called.
   * 
   * @param options - Agent configuration options
   */
  constructor(options) {
    if (!options.model) {
      throw new BlinkAIError("Agent model is required");
    }
    this.config = options;
    try {
      this.httpClient = _getDefaultHttpClient();
    } catch {
    }
  }
  /**
   * Internal: Set the HTTP client (called by BlinkClient)
   */
  _setHttpClient(client) {
    this.httpClient = client;
  }
  /**
   * Internal: Get the agent config for API requests
   */
  getAgentConfig() {
    const { model, system, instructions, tools, webhookTools, clientTools, toolChoice, stopWhen, maxSteps } = this.config;
    const serializedTools = tools ? serializeTools(tools) : void 0;
    const stopConditions = createStopConditions(maxSteps, stopWhen);
    return {
      model,
      system: system || instructions,
      tools: serializedTools,
      webhook_tools: webhookTools,
      client_tools: clientTools,
      tool_choice: toolChoice,
      stop_when: stopConditions
    };
  }
  /**
   * Generate a response (non-streaming)
   * 
   * @param options - Generation options (prompt or messages)
   * @returns Promise<AgentResponse> with text, steps, usage, and billing
   * 
   * @example
   * ```ts
   * const result = await agent.generate({
   *   prompt: 'What is the weather in San Francisco?',
   * })
   * console.log(result.text)
   * console.log(result.steps)
   * ```
   */
  async generate(options) {
    if (!this.httpClient) {
      throw new BlinkAIError(
        "Agent not initialized. Call createClient() first, or use useAgent() in React."
      );
    }
    if (!options.prompt && !options.messages) {
      throw new BlinkAIError("Either prompt or messages is required");
    }
    if (options.prompt && options.messages) {
      throw new BlinkAIError("prompt and messages are mutually exclusive");
    }
    try {
      const requestBody = {
        stream: false,
        agent: this.getAgentConfig()
      };
      if (options.prompt) {
        requestBody.prompt = options.prompt;
      } else if (options.messages) {
        requestBody.messages = options.messages;
      }
      if (options.sandbox) {
        requestBody.sandbox_id = typeof options.sandbox === "string" ? options.sandbox : options.sandbox.id;
      }
      const response = await this.httpClient.aiAgent(requestBody, options.signal);
      return response.data;
    } catch (error) {
      console.error("[Agent] generate failed:", error);
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Agent generate failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Stream a response (real-time)
   * 
   * @param options - Stream options (prompt or messages)
   * @returns Promise<Response> - AI SDK UI Message Stream for useChat compatibility
   * 
   * @example
   * ```ts
   * const stream = await agent.stream({
   *   prompt: 'Tell me a story',
   * })
   * 
   * // Process stream
   * for await (const chunk of stream.body) {
   *   // Handle chunk
   * }
   * ```
   */
  async stream(options) {
    if (!this.httpClient) {
      throw new BlinkAIError(
        "Agent not initialized. Call createClient() first, or use useAgent() in React."
      );
    }
    if (!options.prompt && !options.messages) {
      throw new BlinkAIError("Either prompt or messages is required");
    }
    if (options.prompt && options.messages) {
      throw new BlinkAIError("prompt and messages are mutually exclusive");
    }
    try {
      const requestBody = {
        stream: true,
        agent: this.getAgentConfig()
      };
      if (options.prompt) {
        requestBody.prompt = options.prompt;
      } else if (options.messages) {
        requestBody.messages = options.messages;
      }
      if (options.sandbox) {
        requestBody.sandbox_id = typeof options.sandbox === "string" ? options.sandbox : options.sandbox.id;
      }
      return await this.httpClient.aiAgentStream(requestBody, options.signal);
    } catch (error) {
      console.error("[Agent] stream failed:", error);
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Agent stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Get the agent's model
   */
  get model() {
    return this.config.model;
  }
  /**
   * Get the agent's system prompt
   */
  get system() {
    return this.config.system || this.config.instructions;
  }
  /**
   * Get the agent's tools
   */
  get tools() {
    return this.config.tools;
  }
};
var BlinkAIImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * Validates if a URL is a valid HTTPS image URL.
   *
   * Deliberately does NOT require a known image extension. This check runs in
   * the user's app, before any request leaves it, so a URL rejected here never
   * reaches the API at all — and it was rejecting the user's own photos. Files
   * uploaded as a Blob were stored with a `.blob` / `.bin` name (correct bytes,
   * correct `image/*` Content-Type) and those objects still exist. The media
   * type is resolved from the response Content-Type when the image is fetched,
   * never from the URL suffix, so the suffix guaranteed nothing.
   */
  validateImageUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:") {
        return { isValid: false, error: "Image URLs must use HTTPS protocol" };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: "Invalid URL format" };
    }
  }
  /**
   * Validates messages for image content
   */
  validateMessages(messages) {
    const errors = [];
    messages.forEach((message, messageIndex) => {
      if (Array.isArray(message.content)) {
        message.content.forEach((item, contentIndex) => {
          if (item.type === "image") {
            if (!item.image || typeof item.image !== "string") {
              errors.push(`Message ${messageIndex}, content ${contentIndex}: Image content must have a valid image URL`);
            } else {
              const validation = this.validateImageUrl(item.image);
              if (!validation.isValid) {
                errors.push(`Message ${messageIndex}, content ${contentIndex}: ${validation.error}`);
              }
            }
          }
        });
      }
    });
    return { isValid: errors.length === 0, errors };
  }
  /**
   * Get MIME type for audio format
   */
  getMimeTypeForFormat(format) {
    const mimeTypes = {
      mp3: "audio/mpeg",
      opus: "audio/opus",
      aac: "audio/aac",
      flac: "audio/flac",
      wav: "audio/wav",
      pcm: "audio/pcm"
    };
    return mimeTypes[format] || "audio/mpeg";
  }
  /**
   * Generates a text response using the Blink AI engine.
   * 
   * @param options - An object containing either:
   *   - `prompt`: a simple string prompt
   *   - OR `messages`: an array of chat messages for conversation
   *   - Plus optional model, search, maxSteps, experimental_continueSteps, maxTokens, temperature, signal parameters
   * 
   * @example
   * ```ts
   * // Simple prompt
   * const { text } = await blink.ai.generateText({ 
   *   prompt: "Write a poem about coding" 
   * });
   * 
   * // Chat messages (text only)
   * const { text } = await blink.ai.generateText({
   *   messages: [
   *     { role: "system", content: "You are a helpful assistant" },
   *     { role: "user", content: "Explain quantum computing" }
   *   ]
   * });
   * 
   * // With image content
   * const { text } = await blink.ai.generateText({
   *   messages: [
   *     { 
   *       role: "user", 
   *       content: [
   *         { type: "text", text: "What do you see in this image?" },
   *         { type: "image", image: "https://example.com/photo.jpg" }
   *       ]
   *     }
   *   ]
   * });
   * 
   * // Mixed content with multiple images
   * const { text } = await blink.ai.generateText({
   *   messages: [
   *     { 
   *       role: "user", 
   *       content: [
   *         { type: "text", text: "Compare these two images:" },
   *         { type: "image", image: "https://example.com/image1.jpg" },
   *         { type: "image", image: "https://example.com/image2.jpg" }
   *       ]
   *     }
   *   ]
   * });
   * 
   * // With options
   * const { text, usage } = await blink.ai.generateText({
   *   prompt: "Summarize this article",
   *   model: "gpt-4.1-mini",
   *   maxTokens: 150,
   *   temperature: 0.7
   * });
   * 
   * // With web search (OpenAI models only)
   * const { text, sources } = await blink.ai.generateText({
   *   prompt: "What are the latest developments in AI?",
   *   model: "gpt-4.1-mini",
   *   search: true // Enables web search
   * });
   * 
   * // With advanced multi-step configuration
   * const { text } = await blink.ai.generateText({
   *   prompt: "Research and analyze recent tech trends",
   *   model: "gpt-4o",
   *   search: true,
   *   maxSteps: 10, // Allow up to 10 reasoning steps
   *   experimental_continueSteps: true // Enable continued reasoning
   * });
   * ```
   * 
   * @returns Promise<TextGenerationResponse> - Object containing:
   *   - `text`: Generated text string
   *   - `usage`: Token usage information
   *   - `finishReason`: Why generation stopped ("stop", "length", etc.)
   */
  async generateText(options) {
    try {
      if (!options.prompt && !options.messages) {
        throw new BlinkAIError("Either prompt or messages is required");
      }
      if (options.messages) {
        const validation = this.validateMessages(options.messages);
        if (!validation.isValid) {
          throw new BlinkAIError(`Message validation failed: ${validation.errors.join("; ")}`);
        }
      }
      const requestBody = {
        model: options.model,
        stream: false,
        // System instruction — was silently dropped for years while generated
        // apps guessed `systemPrompt:` constantly; the server accepts both
        // names (blink-apis text endpoint maps them to the AI SDK `system`).
        system: options.system ?? options.systemPrompt,
        search: options.search,
        maxSteps: options.maxSteps,
        experimental_continueSteps: options.experimental_continueSteps,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        signal: options.signal
      };
      if (options.prompt) {
        requestBody.prompt = options.prompt;
      }
      if (options.messages) {
        requestBody.messages = options.messages;
      }
      const response = await this.httpClient.aiText(
        options.prompt || "",
        requestBody
      );
      return response.data;
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Text generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Streams text generation with real-time updates as the AI generates content.
   * 
   * @param options - Same as generateText: either `prompt` or `messages` with optional parameters including search, maxSteps, experimental_continueSteps
   * @param onChunk - Callback function that receives each text chunk as it's generated
   * 
   * @example
   * ```ts
   * // Stream with prompt
   * await blink.ai.streamText(
   *   { prompt: "Write a short story about space exploration" },
   *   (chunk) => {
   *     process.stdout.write(chunk); // Real-time output
   *   }
   * );
   * 
   * // Stream with messages
   * await blink.ai.streamText(
   *   { 
   *     messages: [
   *       { role: "system", content: "You are a creative writer" },
   *       { role: "user", content: "Write a haiku about programming" }
   *     ]
   *   },
   *   (chunk) => updateUI(chunk)
   * );
   * ```
   * 
   * @returns Promise<TextGenerationResponse> - Final complete response with full text and metadata
   */
  async streamText(options, onChunk) {
    try {
      if (!options.prompt && !options.messages) {
        throw new BlinkAIError("Either prompt or messages is required");
      }
      if (options.messages) {
        const validation = this.validateMessages(options.messages);
        if (!validation.isValid) {
          throw new BlinkAIError(`Message validation failed: ${validation.errors.join("; ")}`);
        }
      }
      const result = await this.httpClient.streamAiText(
        options.prompt || "",
        {
          model: options.model,
          messages: options.messages,
          system: options.system ?? options.systemPrompt,
          search: options.search,
          maxSteps: options.maxSteps,
          experimental_continueSteps: options.experimental_continueSteps,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          signal: options.signal
        },
        onChunk
      );
      return {
        text: result.text || "",
        finishReason: result.finishReason || "stop",
        usage: result.usage,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        sources: result.sources,
        files: result.files,
        reasoningDetails: result.reasoning,
        response: result.response
      };
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Text streaming failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Generates structured JSON objects using AI with schema validation.
   * 
   * @param options - Object containing:
   *   - `prompt`: Description of what object to generate (required)
   *   - `schema`: JSON Schema to validate the generated object
   *   - `output`: Type of output ("object", "array", "enum")
   *   - `enum`: Array of allowed values for enum output
   *   - Plus optional model, signal parameters
   * 
   * @example
   * ```ts
   * // Generate user profile
   * const { object } = await blink.ai.generateObject({
   *   prompt: "Generate a user profile for a software developer",
   *   schema: {
   *     type: "object",
   *     properties: {
   *       name: { type: "string" },
   *       age: { type: "number" },
   *       skills: { type: "array", items: { type: "string" } },
   *       experience: { type: "number" }
   *     },
   *     required: ["name", "skills"]
   *   }
   * });
   * 
   * // Generate array of items
   * const { object } = await blink.ai.generateObject({
   *   prompt: "List 5 programming languages",
   *   output: "array",
   *   schema: {
   *     type: "array",
   *     items: { type: "string" }
   *   }
   * });
   * 
   * // Generate enum value
   * const { object } = await blink.ai.generateObject({
   *   prompt: "Choose the best programming language for web development",
   *   output: "enum",
   *   enum: ["JavaScript", "Python", "TypeScript", "Go"]
   * });
   * ```
   * 
   * @returns Promise<ObjectGenerationResponse> - Object containing:
   *   - `object`: The generated and validated JSON object/array/enum
   *   - `usage`: Token usage information
   *   - `finishReason`: Why generation stopped
   */
  async generateObject(options) {
    try {
      if (!options.prompt) {
        throw new BlinkAIError("Prompt is required");
      }
      const response = await this.httpClient.aiObject(
        options.prompt,
        {
          model: options.model,
          output: options.output,
          schema: options.schema,
          enum: options.enum,
          stream: false,
          signal: options.signal
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Object generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Streams structured object generation with real-time partial updates as the AI builds the object.
   * 
   * @param options - Same as generateObject: prompt, schema, output type, etc.
   * @param onPartial - Callback function that receives partial object updates as they're generated
   * 
   * @example
   * ```ts
   * // Stream object generation with schema
   * await blink.ai.streamObject(
   *   {
   *     prompt: "Generate a detailed product catalog entry",
   *     schema: {
   *       type: "object",
   *       properties: {
   *         name: { type: "string" },
   *         price: { type: "number" },
   *         description: { type: "string" },
   *         features: { type: "array", items: { type: "string" } }
   *       }
   *     }
   *   },
   *   (partial) => {
   *     console.log("Partial update:", partial);
   *     updateProductForm(partial); // Update UI in real-time
   *   }
   * );
   * ```
   * 
   * @returns Promise<ObjectGenerationResponse> - Final complete object with metadata
   */
  async streamObject(options, onPartial) {
    try {
      if (!options.prompt) {
        throw new BlinkAIError("Prompt is required");
      }
      const result = await this.httpClient.streamAiObject(
        options.prompt,
        {
          model: options.model,
          output: options.output,
          schema: options.schema,
          enum: options.enum,
          signal: options.signal
        },
        onPartial
      );
      return {
        object: result.object || {},
        finishReason: "stop",
        usage: result.usage
      };
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Object streaming failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Generates images from text descriptions using AI image models.
   * 
   * @param options - Object containing:
   *   - `prompt`: Text description of the desired image (required, up to 100k characters)
   *   - `model`: AI model to use (optional). Available models:
   *       **Fal.ai Models (Recommended):**
   *       - `"fal-ai/nano-banana"` (default) - Gemini 2.5 Flash Image (Fast)
   *       - `"fal-ai/nano-banana-pro"` - Gemini 3 Pro Image (High quality)
   *       - `"fal-ai/gemini-25-flash-image"` - Alias for nano-banana
   *       - `"fal-ai/gemini-3-pro-image-preview"` - Alias for nano-banana-pro
   *       **Legacy Gemini Models:**
   *       - `"gemini-2.5-flash-image-preview"` - Direct Gemini API
   *       - `"gemini-3-pro-image-preview"` - Direct Gemini API
   *   - `n`: Number of images to generate (default: 1)
   *   - `size`: Image dimensions (e.g., "1024x1024", "512x512")
   *   - Plus optional signal parameter
   * 
   * @example
   * ```ts
   * // Basic image generation (uses default fast model)
   * const { data } = await blink.ai.generateImage({
   *   prompt: "A serene landscape with mountains and a lake at sunset"
   * });
   * console.log("Image URL:", data[0].url);
   * 
   * // High quality generation with Pro model
   * const { data } = await blink.ai.generateImage({
   *   prompt: "A detailed infographic about AI with charts and diagrams",
   *   model: "fal-ai/nano-banana-pro",
   *   n: 2
   * });
   * 
   * // Fast generation with specific size
   * const { data } = await blink.ai.generateImage({
   *   prompt: "A futuristic city skyline with flying cars",
   *   model: "fal-ai/nano-banana",
   *   size: "1024x1024",
   *   n: 3
   * });
   * data.forEach((img, i) => console.log(`Image ${i+1}:`, img.url));
   * 
   * // Using legacy Gemini model
   * const { data } = await blink.ai.generateImage({
   *   prompt: "A cute robot mascot for a tech company",
   *   model: "gemini-2.5-flash-image-preview"
   * });
   * ```
   * 
   * @returns Promise<ImageGenerationResponse> - Object containing:
   *   - `data`: Array of generated images with URLs
   *   - `created`: Timestamp of generation
   *   - `model`: The model used for generation
   */
  async generateImage(options) {
    try {
      if (!options.prompt) {
        throw new BlinkAIError("Prompt is required");
      }
      const response = await this.httpClient.aiImage(
        options.prompt,
        {
          model: options.model,
          n: options.n,
          size: options.size,
          signal: options.signal
        }
      );
      let imageResponse;
      if (response.data?.result?.data) {
        imageResponse = response.data.result;
      } else if (response.data?.data) {
        imageResponse = response.data;
      } else {
        throw new BlinkAIError("Invalid response format: missing image data");
      }
      if (!Array.isArray(imageResponse.data)) {
        throw new BlinkAIError("Invalid response format: data should be an array");
      }
      imageResponse.data = imageResponse.data.map((item) => {
        if (typeof item === "string") {
          return { url: item };
        } else if (item.url) {
          return item;
        } else {
          throw new BlinkAIError("Invalid image response format");
        }
      });
      return imageResponse;
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Modifies existing images using AI image editing models with text prompts for image-to-image editing.
   * 
   * @param options - Object containing:
   *   - `images`: Array of public image URLs to modify (required, up to 50 images)
   *   - `prompt`: Text description of desired modifications (required, up to 100k characters)
   *   - `model`: AI model to use (optional). Available editing models:
   *       **Fal.ai Editing Models (Recommended):**
   *       - `"fal-ai/nano-banana/edit"` (default) - Flash editing (Fast)
   *       - `"fal-ai/nano-banana-pro/edit"` - Pro editing (High quality)
   *       - `"fal-ai/gemini-25-flash-image/edit"` - Alias for nano-banana/edit
   *       - `"fal-ai/gemini-3-pro-image-preview/edit"` - Alias for nano-banana-pro/edit
   *       **Legacy Gemini Models:**
   *       - `"gemini-2.5-flash-image-preview"` - Direct Gemini API
   *       - `"gemini-3-pro-image-preview"` - Direct Gemini API
   *   - `n`: Number of output images to generate (default: 1)
   *   - Plus optional signal parameter
   * 
   * @example
   * ```ts
   * // Fast editing with default model
   * const { data } = await blink.ai.modifyImage({
   *   images: ["https://storage.example.com/photo.jpg"],
   *   prompt: "make it green"
   * });
   * 
   * // High quality editing with Pro model
   * const { data } = await blink.ai.modifyImage({
   *   images: ["https://storage.example.com/landscape.jpg"],
   *   prompt: "add a tree in the background",
   *   model: "fal-ai/nano-banana-pro/edit"
   * });
   * 
   * // Professional headshots from casual photos
   * const { data } = await blink.ai.modifyImage({
   *   images: [
   *     "https://storage.example.com/user-photo-1.jpg",
   *     "https://storage.example.com/user-photo-2.jpg"
   *   ],
   *   prompt: "Transform into professional business headshots with studio lighting",
   *   model: "fal-ai/nano-banana/edit",
   *   n: 4
   * });
   * data.forEach((img, i) => console.log(`Headshot ${i+1}:`, img.url));
   * 
   * // Artistic style transformation
   * const { data } = await blink.ai.modifyImage({
   *   images: ["https://storage.example.com/portrait.jpg"],
   *   prompt: "Transform into oil painting style with dramatic lighting",
   *   model: "fal-ai/nano-banana-pro/edit"
   * });
   * 
   * // Background replacement
   * const { data } = await blink.ai.modifyImage({
   *   images: ["https://storage.example.com/product.jpg"],
   *   prompt: "Remove background and place on clean white studio background",
   *   n: 2
   * });
   * 
   * // Batch processing multiple photos
   * const userPhotos = [
   *   "https://storage.example.com/photo1.jpg",
   *   "https://storage.example.com/photo2.jpg",
   *   "https://storage.example.com/photo3.jpg"
   * ];
   * const { data } = await blink.ai.modifyImage({
   *   images: userPhotos,
   *   prompt: "Convert to black and white vintage style photographs"
   * });
   * 
   * // 🎨 Style Transfer - IMPORTANT: Provide all images in array
   * // ❌ WRONG - Don't reference other images in prompt
   * const wrong = await blink.ai.modifyImage({
   *   images: [userPhotoUrl],
   *   prompt: `Apply hairstyle from ${referenceUrl}`
   * });
   * 
   * // ✅ CORRECT - Provide all images in array
   * const { data } = await blink.ai.modifyImage({
   *   images: [userPhotoUrl, hairstyleReferenceUrl],
   *   prompt: "Apply the hairstyle from the second image to the person in the first image"
   * });
   * ```
   * 
   * @returns Promise<ImageGenerationResponse> - Object containing:
   *   - `data`: Array of modified images with URLs
   *   - `created`: Timestamp of generation
   *   - `model`: The model used for editing
   */
  async modifyImage(options) {
    try {
      if (!options.prompt) {
        throw new BlinkAIError("Prompt is required");
      }
      if (!options.images || !Array.isArray(options.images) || options.images.length === 0) {
        throw new BlinkAIError("Images array is required and must contain at least one image URL");
      }
      if (options.images.length > 50) {
        throw new BlinkAIError("Maximum 50 images allowed");
      }
      for (let i = 0; i < options.images.length; i++) {
        const validation = this.validateImageUrl(options.images[i]);
        if (!validation.isValid) {
          throw new BlinkAIError(`Image ${i + 1}: ${validation.error}`);
        }
      }
      const response = await this.httpClient.aiImage(
        options.prompt,
        // Non-null assertion since we validated above
        {
          model: options.model,
          images: options.images,
          n: options.n,
          signal: options.signal
        }
      );
      let imageResponse;
      if (response.data?.result?.data) {
        imageResponse = response.data.result;
      } else if (response.data?.data) {
        imageResponse = response.data;
      } else {
        throw new BlinkAIError("Invalid response format: missing image data");
      }
      if (!Array.isArray(imageResponse.data)) {
        throw new BlinkAIError("Invalid response format: data should be an array");
      }
      imageResponse.data = imageResponse.data.map((item) => {
        if (typeof item === "string") {
          return { url: item };
        } else if (item.url) {
          return item;
        } else {
          throw new BlinkAIError("Invalid image response format");
        }
      });
      return imageResponse;
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Image modification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Generates videos from text prompts or images using AI video generation models.
   * 
   * @param options - Object containing:
   *   - `prompt`: Text description of the video to generate (required)
   *   - `model`: Video model to use (optional). Available models:
   *       **Text-to-Video Models:**
   *       - `"fal-ai/veo3.1"` - Google Veo 3.1 (best quality)
   *       - `"fal-ai/veo3.1/fast"` (default) - Veo 3.1 fast mode (faster, cheaper)
   *       - `"fal-ai/sora-2/text-to-video/pro"` - OpenAI Sora 2
   *       - `"fal-ai/kling-video/v2.6/pro/text-to-video"` - Kling 2.6
   *       **Image-to-Video Models:**
   *       - `"fal-ai/veo3.1/image-to-video"` - Veo 3.1 I2V
   *       - `"fal-ai/veo3.1/fast/image-to-video"` - Veo 3.1 fast I2V
   *       - `"fal-ai/sora-2/image-to-video/pro"` - Sora 2 I2V
   *       - `"fal-ai/kling-video/v2.6/pro/image-to-video"` - Kling 2.6 I2V
   *   - `image_url`: Source image URL for image-to-video (required for I2V models)
   *   - `duration`: Video duration ("4s", "5s", "6s", "8s", "10s", "12s")
   *   - `aspect_ratio`: Aspect ratio ("16:9", "9:16", "1:1")
   *   - `resolution`: Resolution ("720p", "1080p") - Veo/Sora only
   *   - `negative_prompt`: What to avoid in generation - Veo/Kling only
   *   - `generate_audio`: Generate audio with video (default: true)
   *   - `seed`: For reproducibility - Veo only
   *   - `cfg_scale`: Guidance scale (0-1) - Kling only
   *   - Plus optional signal parameter
   * 
   * @example
   * ```ts
   * // Basic text-to-video generation (uses default fast model)
   * const { result } = await blink.ai.generateVideo({
   *   prompt: "A serene sunset over the ocean with gentle waves"
   * });
   * console.log("Video URL:", result.video.url);
   * 
   * // High quality with Veo 3.1
   * const { result } = await blink.ai.generateVideo({
   *   prompt: "A cinematic shot of a futuristic city at night",
   *   model: "fal-ai/veo3.1",
   *   resolution: "1080p",
   *   aspect_ratio: "16:9"
   * });
   * 
   * // Image-to-video animation
   * const { result } = await blink.ai.generateVideo({
   *   prompt: "Animate this image with gentle camera movement",
   *   model: "fal-ai/veo3.1/fast/image-to-video",
   *   image_url: "https://example.com/my-image.jpg",
   *   duration: "5s"
   * });
   * 
   * // Using Sora 2 for creative videos
   * const { result } = await blink.ai.generateVideo({
   *   prompt: "A magical forest with glowing fireflies",
   *   model: "fal-ai/sora-2/text-to-video/pro",
   *   duration: "8s"
   * });
   * 
   * // Using Kling for detailed videos
   * const { result, usage } = await blink.ai.generateVideo({
   *   prompt: "A professional cooking tutorial scene",
   *   model: "fal-ai/kling-video/v2.6/pro/text-to-video",
   *   negative_prompt: "blur, distort, low quality",
   *   cfg_scale: 0.7
   * });
   * console.log("Credits charged:", usage?.creditsCharged);
   * ```
   * 
   * @returns Promise<VideoGenerationResponse> - Object containing:
   *   - `result.video.url`: URL to the generated video
   *   - `result.video.content_type`: MIME type (video/mp4)
   *   - `result.video.file_name`: Generated filename
   *   - `result.video.file_size`: File size in bytes
   *   - `metadata`: Generation metadata (projectId, timestamp, model)
   *   - `usage`: Credits charged and cost information
   */
  async generateVideo(options) {
    try {
      if (!options.prompt) {
        throw new BlinkAIError("Prompt is required");
      }
      const i2vModels = [
        "fal-ai/veo3.1/image-to-video",
        "fal-ai/veo3.1/fast/image-to-video",
        "fal-ai/sora-2/image-to-video/pro",
        "fal-ai/kling-video/v2.6/pro/image-to-video"
      ];
      if (options.model && i2vModels.includes(options.model) && !options.image_url) {
        throw new BlinkAIError("image_url is required for image-to-video models");
      }
      if (options.image_url) {
        const validation = this.validateImageUrl(options.image_url);
        if (!validation.isValid) {
          throw new BlinkAIError(`Invalid image_url: ${validation.error}`);
        }
      }
      const response = await this.httpClient.aiVideo(
        options.prompt,
        {
          model: options.model,
          image_url: options.image_url,
          duration: options.duration,
          aspect_ratio: options.aspect_ratio,
          resolution: options.resolution,
          negative_prompt: options.negative_prompt,
          generate_audio: options.generate_audio,
          seed: options.seed,
          cfg_scale: options.cfg_scale,
          signal: options.signal
        }
      );
      if (!response.data?.result?.video?.url) {
        throw new BlinkAIError("Invalid response format: missing video URL");
      }
      return response.data;
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Converts text to speech using AI voice synthesis models.
   * 
   * @param options - Object containing:
   *   - `text`: Text content to convert to speech (required)
   *   - `voice`: Voice to use ("alloy", "echo", "fable", "onyx", "nova", "shimmer")
   *   - `response_format`: Audio format ("mp3", "opus", "aac", "flac", "wav", "pcm")
   *   - `speed`: Speech speed (0.25 to 4.0, default: 1.0)
   *   - Plus optional model, signal parameters
   * 
   * @example
   * ```ts
   * // Basic text-to-speech
   * const { url } = await blink.ai.generateSpeech({
   *   text: "Hello, welcome to our AI-powered application!"
   * });
   * console.log("Audio URL:", url);
   * 
   * // Custom voice and format
   * const { url, voice, format } = await blink.ai.generateSpeech({
   *   text: "This is a demonstration of our speech synthesis capabilities.",
   *   voice: "nova",
   *   response_format: "wav",
   *   speed: 1.2
   * });
   * console.log(`Generated ${format} audio with ${voice} voice:`, url);
   * 
   * // Slow, clear speech for accessibility
   * const { url } = await blink.ai.generateSpeech({
   *   text: "Please listen carefully to these important instructions.",
   *   voice: "echo",
   *   speed: 0.8
   * });
   * ```
   * 
   * @returns Promise<SpeechGenerationResponse> - Object containing:
   *   - `url`: URL to the generated audio file
   *   - `voice`: Voice used for generation
   *   - `format`: Audio format
   *   - `mimeType`: MIME type of the audio
   */
  async generateSpeech(options) {
    try {
      if (!options.text) {
        throw new BlinkAIError("Text is required");
      }
      const response = await this.httpClient.aiSpeech(
        options.text,
        {
          model: options.model,
          voice: options.voice,
          response_format: options.response_format,
          speed: options.speed,
          signal: options.signal
        }
      );
      let speechResponse;
      if (response.data?.result) {
        speechResponse = response.data.result;
      } else if (response.data?.url) {
        speechResponse = response.data;
      } else {
        throw new BlinkAIError("Invalid response format: missing speech data");
      }
      if (!speechResponse.url) {
        if (typeof response.data === "string") {
          speechResponse = {
            url: response.data,
            voice: options.voice || "alloy",
            format: options.response_format || "mp3",
            mimeType: this.getMimeTypeForFormat(options.response_format || "mp3")
          };
        } else if (response.data?.data) {
          speechResponse = {
            url: response.data.data,
            voice: options.voice || "alloy",
            format: options.response_format || "mp3",
            mimeType: this.getMimeTypeForFormat(options.response_format || "mp3")
          };
        } else {
          throw new BlinkAIError("Invalid response format: no audio URL found");
        }
      }
      if (!speechResponse.voice) {
        speechResponse.voice = options.voice || "alloy";
      }
      if (!speechResponse.format) {
        speechResponse.format = options.response_format || "mp3";
      }
      if (!speechResponse.mimeType) {
        speechResponse.mimeType = this.getMimeTypeForFormat(speechResponse.format);
      }
      return speechResponse;
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Speech generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  /**
   * Transcribes audio content to text using AI speech recognition models.
   * 
   * @param options - Object containing:
   *   - `audio`: Audio input as URL string, base64 string, or number array buffer (required)
   *   - `language`: Language code for transcription (e.g., "en", "es", "fr")
   *   - `response_format`: Output format ("json", "text", "srt", "verbose_json", "vtt")
   *   - Plus optional model, signal parameters
   * 
   * @example
   * ```ts
   * // Transcribe from URL
   * const { text } = await blink.ai.transcribeAudio({
   *   audio: "https://example.com/meeting-recording.mp3"
   * });
   * console.log("Transcription:", text);
   * 
   * // Transcribe with language hint
   * const { text, language } = await blink.ai.transcribeAudio({
   *   audio: "https://example.com/spanish-audio.wav",
   *   language: "es"
   * });
   * console.log(`Transcribed ${language}:`, text);
   * 
   * // Transcribe with timestamps (verbose format)
   * const result = await blink.ai.transcribeAudio({
   *   audio: audioFileUrl,
   *   response_format: "verbose_json"
   * });
   * result.segments?.forEach(segment => {
   *   console.log(`${segment.start}s - ${segment.end}s: ${segment.text}`);
   * });
   * 
   * // Transcribe from audio buffer
   * const audioBuffer = new Array(1024).fill(0); // Your audio data
   * const { text } = await blink.ai.transcribeAudio({
   *   audio: audioBuffer,
   *   language: "en"
   * });
   * ```
   * 
   * @returns Promise<TranscriptionResponse> - Object containing:
   *   - `text`: Transcribed text content
   *   - `transcript`: Alias for text
   *   - `segments`: Array of timestamped segments (if verbose format)
   *   - `language`: Detected language
   *   - `duration`: Audio duration in seconds
   */
  async transcribeAudio(options) {
    try {
      if (!options.audio) {
        throw new BlinkAIError("Audio is required");
      }
      const response = await this.httpClient.aiTranscribe(
        options.audio,
        {
          model: options.model,
          language: options.language,
          response_format: options.response_format,
          signal: options.signal
        }
      );
      if (response.data?.result) {
        return response.data.result;
      } else if (response.data?.text || response.data?.transcript) {
        return {
          text: response.data.text || response.data.transcript,
          transcript: response.data.transcript || response.data.text,
          ...response.data
        };
      } else {
        throw new BlinkAIError("Invalid response format: missing transcription text");
      }
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Audio transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  async agent(options) {
    try {
      if (!options.agent?.model) {
        throw new BlinkAIError("agent.model is required");
      }
      if (!options.prompt && !options.messages) {
        throw new BlinkAIError("Either prompt or messages is required");
      }
      if (options.prompt && options.messages) {
        throw new BlinkAIError("prompt and messages are mutually exclusive");
      }
      const serializedTools = options.agent.tools ? serializeTools(options.agent.tools) : void 0;
      const requestBody = {
        stream: options.stream,
        agent: {
          model: options.agent.model,
          system: options.agent.system,
          tools: serializedTools,
          webhook_tools: options.agent.webhook_tools,
          client_tools: options.agent.client_tools,
          tool_choice: options.agent.tool_choice,
          stop_when: options.agent.stop_when,
          prepare_step: options.agent.prepare_step
        }
      };
      if (options.prompt) {
        requestBody.prompt = options.prompt;
      } else if (options.messages) {
        requestBody.messages = options.messages;
      }
      if (options.stream) {
        return await this.httpClient.aiAgentStream(requestBody, options.signal);
      } else {
        const response = await this.httpClient.aiAgent(requestBody, options.signal);
        return response.data;
      }
    } catch (error) {
      if (error instanceof BlinkAIError) {
        throw error;
      }
      throw new BlinkAIError(
        `Agent request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        upstreamStatus(error),
        { originalError: error },
        upstreamCode(error)
      );
    }
  }
  // ============================================================================
  // Agent Factory
  // ============================================================================
  /**
   * Creates a reusable Agent instance with the Vercel AI SDK pattern.
   * 
   * The Agent can be used multiple times with different prompts:
   * - `agent.generate({ prompt })` for non-streaming
   * - `agent.stream({ prompt })` for streaming
   * 
   * @param options - Agent configuration (model, tools, system, etc.)
   * @returns Agent instance
   * 
   * @example
   * ```ts
   * const weatherAgent = blink.ai.createAgent({
   *   model: 'anthropic/claude-sonnet-4-20250514',
   *   system: 'You are a helpful weather assistant.',
   *   tools: [webSearch, fetchUrl],
   *   maxSteps: 10,
   * })
   * 
   * // Non-streaming
   * const result = await weatherAgent.generate({
   *   prompt: 'What is the weather in San Francisco?',
   * })
   * 
   * // Streaming
   * const stream = await weatherAgent.stream({
   *   prompt: 'Tell me about weather patterns',
   * })
   * ```
   */
  createAgent(options) {
    if (!options) {
      throw new BlinkAIError("createAgent(options) requires an options object with at least a `model`.");
    }
    const agent = new Agent(options);
    agent._setHttpClient(this.httpClient);
    return agent;
  }
  /**
   * Binds an existing Agent instance to this client's HTTP client.
   * 
   * Used internally by useAgent() when an Agent instance is passed.
   * This allows agents created with `new Agent()` to be used with the hook.
   * 
   * @param agent - Existing Agent instance
   * @returns The same Agent instance (with httpClient set)
   */
  bindAgent(agent) {
    if (!agent) {
      throw new BlinkAIError(
        "bindAgent(agent) requires an Agent instance but received null/undefined. Create one first with `new Agent({...})` or `blink.ai.createAgent({...})`. (The useAgent() hook stays idle while its `agent` is null, so this only fires on a direct bindAgent() call with a missing agent.)"
      );
    }
    agent._setHttpClient(this.httpClient);
    return agent;
  }
};
var BlinkDataImpl = class {
  constructor(httpClient, projectId) {
    this.httpClient = httpClient;
    this.projectId = projectId;
  }
  async extractFromUrl(url, options = {}) {
    const { chunking = false, chunkSize } = options;
    const request = { url, chunking, chunkSize };
    const response = await this.httpClient.dataExtractFromUrl(this.projectId, request);
    return chunking ? response.data.chunks : response.data.text;
  }
  async extractFromBlob(file, options = {}) {
    const { chunking = false, chunkSize } = options;
    const response = await this.httpClient.dataExtractFromBlob(this.projectId, file, chunking, chunkSize);
    return chunking ? response.data.chunks : response.data.text;
  }
  async scrape(url) {
    const request = {
      url,
      formats: ["markdown", "html", "links", "extract", "metadata"]
    };
    const response = await this.httpClient.dataScrape(this.projectId, request);
    const data = response.data;
    return {
      markdown: data.markdown || "",
      html: data.html || "",
      metadata: {
        title: data.metadata?.title || "",
        description: data.metadata?.description || "",
        url: data.metadata?.url || url,
        domain: data.metadata?.domain || new URL(url).hostname,
        favicon: data.metadata?.favicon,
        image: data.metadata?.image,
        author: data.metadata?.author,
        publishedTime: data.metadata?.publishedTime,
        modifiedTime: data.metadata?.modifiedTime,
        type: data.metadata?.type,
        siteName: data.metadata?.siteName,
        locale: data.metadata?.locale,
        keywords: data.metadata?.keywords || []
      },
      links: data.links || [],
      extract: {
        title: data.extract?.title || data.metadata?.title || "",
        description: data.extract?.description || data.metadata?.description || "",
        headings: data.extract?.headings || [],
        text: data.extract?.text || data.markdown || ""
      }
    };
  }
  async screenshot(url, options = {}) {
    const request = { url, ...options };
    const response = await this.httpClient.dataScreenshot(this.projectId, request);
    return response.data.url;
  }
  async fetch(request) {
    const response = await this.httpClient.dataFetch(this.projectId, request);
    if ("status" in response.data && "headers" in response.data) {
      return response.data;
    }
    throw new BlinkDataError("Unexpected response format from fetch endpoint");
  }
  async fetchAsync(request) {
    const asyncRequest = { ...request, async: true };
    const response = await this.httpClient.dataFetch(this.projectId, asyncRequest);
    if ("status" in response.data && response.data.status === "triggered") {
      return response.data;
    }
    throw new BlinkDataError("Unexpected response format from async fetch endpoint");
  }
  async search(query, options) {
    const normalizeType = (type) => {
      switch (type) {
        case "news":
          return "nws";
        case "images":
        case "image":
          return "isch";
        case "videos":
        case "video":
          return "vid";
        case "shopping":
        case "shop":
          return "shop";
        default:
          return void 0;
      }
    };
    const request = {
      q: query,
      location: options?.location,
      hl: options?.language || "en",
      tbm: normalizeType(options?.type),
      num: options?.limit
    };
    const response = await this.httpClient.dataSearch(this.projectId, request);
    return response.data;
  }
};
var getWebSocketClass = () => {
  if (typeof WebSocket !== "undefined") {
    return WebSocket;
  }
  try {
    const WS = __require2("ws");
    return WS;
  } catch (error) {
    throw new BlinkRealtimeError('WebSocket is not available. Install "ws" package for Node.js environments.');
  }
};
var RealtimeConnection = class {
  constructor(httpClient, projectId) {
    this.httpClient = httpClient;
    this.projectId = projectId;
  }
  websocket = null;
  isConnected = false;
  isConnecting = false;
  reconnectTimer = null;
  heartbeatTimer = null;
  reconnectAttempts = 0;
  connectionPromise = null;
  // Channel management
  channels = /* @__PURE__ */ new Map();
  pendingSubscriptions = /* @__PURE__ */ new Map();
  // Message queue for when socket not ready
  messageQueue = [];
  /**
   * Check if connection is ready
   */
  isReady() {
    return this.isConnected && this.websocket?.readyState === 1;
  }
  /**
   * Ensure WebSocket connection is established
   */
  async connect() {
    if (this.isConnected && this.websocket?.readyState === 1) {
      return;
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.connectionPromise = this.connectWebSocket();
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }
  /**
   * Join a channel (subscribe)
   */
  async joinChannel(channelName, handler, options = {}) {
    await this.connect();
    this.channels.set(channelName, { handler, options });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingSubscriptions.delete(channelName);
        this.channels.delete(channelName);
        reject(new BlinkRealtimeError("Subscription timeout - no acknowledgment from server"));
      }, 1e4);
      this.pendingSubscriptions.set(channelName, { resolve, reject, timeout });
      const subscribeMessage = {
        type: "subscribe",
        payload: {
          channel: channelName,
          userId: options.userId,
          metadata: options.metadata
        }
      };
      try {
        this.sendRaw(JSON.stringify(subscribeMessage));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingSubscriptions.delete(channelName);
        this.channels.delete(channelName);
        reject(error);
      }
    });
  }
  /**
   * Leave a channel (unsubscribe)
   */
  async leaveChannel(channelName) {
    this.channels.delete(channelName);
    const pending = this.pendingSubscriptions.get(channelName);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(new BlinkRealtimeError("Subscription cancelled"));
      this.pendingSubscriptions.delete(channelName);
    }
    if (this.websocket && this.websocket.readyState === 1) {
      const unsubscribeMessage = {
        type: "unsubscribe",
        payload: { channel: channelName }
      };
      this.websocket.send(JSON.stringify(unsubscribeMessage));
    }
    if (this.channels.size === 0) {
      this.disconnect();
    }
  }
  /**
   * Send a message to a channel
   */
  async send(channelName, type, data, options = {}) {
    await this.connect();
    const publishMessage = {
      type: "publish",
      payload: {
        channel: channelName,
        type,
        data,
        userId: options.userId,
        metadata: options.metadata
      }
    };
    return this.sendWithResponse(JSON.stringify(publishMessage), channelName);
  }
  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.isConnected = false;
    this.isConnecting = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.messageQueue.forEach((q2) => {
      clearTimeout(q2.timeout);
      q2.reject(new BlinkRealtimeError("Connection closed"));
    });
    this.messageQueue = [];
    this.pendingSubscriptions.forEach((pending, channel) => {
      clearTimeout(pending.timeout);
      pending.reject(new BlinkRealtimeError("Connection closed"));
    });
    this.pendingSubscriptions.clear();
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
  /**
   * Get count of active channels
   */
  getChannelCount() {
    return this.channels.size;
  }
  // Private methods
  async connectWebSocket() {
    if (this.websocket && this.websocket.readyState === 1) {
      this.isConnected = true;
      return;
    }
    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new BlinkRealtimeError("Connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }
    this.isConnecting = true;
    this.isConnected = false;
    return new Promise((resolve, reject) => {
      try {
        const httpClient = this.httpClient;
        const coreUrl = httpClient.coreUrl || "https://core.blink.new";
        const baseUrl = coreUrl.replace("https://", "wss://").replace("http://", "ws://");
        const wsUrl = `${baseUrl}?project_id=${this.projectId}`;
        console.log(`\u{1F517} Connecting to realtime: ${wsUrl}`);
        const WSClass = getWebSocketClass();
        this.websocket = new WSClass(wsUrl);
        if (!this.websocket) {
          this.isConnecting = false;
          reject(new BlinkRealtimeError("Failed to create WebSocket instance"));
          return;
        }
        this.websocket.onopen = () => {
          console.log(`\u{1F517} Connected to realtime for project ${this.projectId}`);
          this.isConnecting = false;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };
        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };
        this.websocket.onclose = () => {
          console.log(`\u{1F50C} Disconnected from realtime for project ${this.projectId}`);
          this.isConnecting = false;
          this.isConnected = false;
          this.rejectQueuedMessages(new BlinkRealtimeError("WebSocket connection closed"));
          this.scheduleReconnect();
        };
        this.websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          this.isConnected = false;
          reject(new BlinkRealtimeError(`WebSocket connection failed to ${wsUrl}`));
        };
        setTimeout(() => {
          if (this.websocket?.readyState !== 1) {
            this.isConnecting = false;
            reject(new BlinkRealtimeError("WebSocket connection timeout"));
          }
        }, 1e4);
      } catch (error) {
        this.isConnecting = false;
        reject(new BlinkRealtimeError(`Failed to create WebSocket connection: ${error instanceof Error ? error.message : "Unknown error"}`));
      }
    });
  }
  handleMessage(message) {
    const channelName = message.payload?.channel;
    switch (message.type) {
      case "connected":
        console.log(`\u2705 WebSocket connected: ${message.payload?.socketId}`);
        break;
      case "subscribed":
        console.log(`\u2705 Subscribed to channel: ${channelName}`);
        const pendingSub = this.pendingSubscriptions.get(channelName);
        if (pendingSub) {
          clearTimeout(pendingSub.timeout);
          pendingSub.resolve();
          this.pendingSubscriptions.delete(channelName);
        }
        const subHandler = this.channels.get(channelName);
        if (subHandler) {
          subHandler.handler.onSubscribed();
        }
        break;
      case "message":
        const msgChannel = this.channels.get(message.payload?.channel);
        if (msgChannel) {
          msgChannel.handler.onMessage(message.payload);
        }
        break;
      case "presence":
        const presChannel = this.channels.get(message.payload?.channel);
        if (presChannel) {
          const users = message.payload?.data?.users || [];
          presChannel.handler.onPresence(users);
        }
        break;
      case "published":
        break;
      case "pong":
        break;
      case "error":
        console.error("Realtime error:", message.payload?.error);
        const errChannel = this.channels.get(channelName);
        if (errChannel) {
          errChannel.handler.onError(message.payload?.error);
        }
        const pendingErr = this.pendingSubscriptions.get(channelName);
        if (pendingErr) {
          clearTimeout(pendingErr.timeout);
          pendingErr.reject(new BlinkRealtimeError(`Subscription error: ${message.payload?.error}`));
          this.pendingSubscriptions.delete(channelName);
        }
        break;
      case "unsubscribed":
        console.log(`\u274C Unsubscribed from channel: ${channelName}`);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }
  sendRaw(message) {
    if (this.websocket && this.websocket.readyState === 1) {
      this.websocket.send(message);
    } else {
      throw new BlinkRealtimeError("Cannot send message: WebSocket not connected");
    }
  }
  sendWithResponse(message, channelName) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.messageQueue.findIndex((q2) => q2.resolve === resolve);
        if (index > -1) {
          this.messageQueue.splice(index, 1);
        }
        reject(new BlinkRealtimeError("Message send timeout - no response from server"));
      }, 1e4);
      if (this.websocket && this.websocket.readyState === 1) {
        const handleResponse = (event) => {
          try {
            const response = JSON.parse(event.data);
            if (response.type === "published" && response.payload.channel === channelName) {
              clearTimeout(timeout);
              this.websocket.removeEventListener("message", handleResponse);
              resolve(response.payload.messageId);
            } else if (response.type === "error") {
              clearTimeout(timeout);
              this.websocket.removeEventListener("message", handleResponse);
              reject(new BlinkRealtimeError(`Server error: ${response.payload.error}`));
            }
          } catch (err) {
          }
        };
        this.websocket.addEventListener("message", handleResponse);
        this.websocket.send(message);
      } else {
        this.messageQueue.push({ message, resolve, reject, timeout });
      }
    });
  }
  flushMessageQueue() {
    if (!this.websocket || this.websocket.readyState !== 1) return;
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    queue.forEach((q2) => {
      try {
        this.websocket.send(q2.message);
      } catch (error) {
        clearTimeout(q2.timeout);
        q2.reject(new BlinkRealtimeError("Failed to send queued message"));
      }
    });
  }
  rejectQueuedMessages(error) {
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    queue.forEach((q2) => {
      clearTimeout(q2.timeout);
      q2.reject(error);
    });
  }
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.heartbeatTimer = globalThis.setInterval(() => {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(JSON.stringify({ type: "ping", payload: {} }));
      }
    }, 25e3);
  }
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.channels.size === 0) {
      return;
    }
    this.reconnectAttempts++;
    const baseDelay = Math.min(3e4, Math.pow(2, this.reconnectAttempts) * 1e3);
    const jitter = Math.random() * 1e3;
    const delay = baseDelay + jitter;
    console.log(`\u{1F504} Scheduling reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms`);
    this.reconnectTimer = globalThis.setTimeout(async () => {
      if (this.channels.size === 0) return;
      try {
        await this.connectWebSocket();
        await this.resubscribeAllChannels();
      } catch (error) {
        console.error("Reconnection failed:", error);
        this.scheduleReconnect();
      }
    }, delay);
  }
  async resubscribeAllChannels() {
    console.log(`\u{1F504} Resubscribing ${this.channels.size} channels...`);
    for (const [channelName, subscription] of this.channels) {
      try {
        const subscribeMessage = {
          type: "subscribe",
          payload: {
            channel: channelName,
            userId: subscription.options.userId,
            metadata: subscription.options.metadata
          }
        };
        if (this.websocket && this.websocket.readyState === 1) {
          this.websocket.send(JSON.stringify(subscribeMessage));
        }
      } catch (error) {
        console.error(`Failed to resubscribe to ${channelName}:`, error);
      }
    }
  }
};
var BlinkRealtimeChannel = class {
  constructor(channelName, connection, httpClient, projectId) {
    this.channelName = channelName;
    this.connection = connection;
    this.httpClient = httpClient;
    this.projectId = projectId;
  }
  messageCallbacks = [];
  presenceCallbacks = [];
  isSubscribed = false;
  subscribeOptions = {};
  /**
   * Check if channel is ready for publishing
   */
  isReady() {
    return this.isSubscribed && this.connection.isReady();
  }
  async subscribe(options = {}) {
    if (this.isSubscribed) {
      return;
    }
    this.subscribeOptions = options;
    const handler = {
      onMessage: (message) => {
        this.messageCallbacks.forEach((callback) => {
          try {
            callback(message);
          } catch (error) {
            console.error("Error in message callback:", error);
          }
        });
      },
      onPresence: (users) => {
        this.presenceCallbacks.forEach((callback) => {
          try {
            callback(users);
          } catch (error) {
            console.error("Error in presence callback:", error);
          }
        });
      },
      onSubscribed: () => {
        this.isSubscribed = true;
      },
      onError: (error) => {
        console.error(`Channel ${this.channelName} error:`, error);
      }
    };
    await this.connection.joinChannel(this.channelName, handler, options);
    this.isSubscribed = true;
  }
  async unsubscribe() {
    if (!this.isSubscribed) {
      return;
    }
    await this.connection.leaveChannel(this.channelName);
    this.cleanup();
  }
  async publish(type, data, options = {}) {
    return this.connection.send(this.channelName, type, data, options);
  }
  onMessage(callback) {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }
  onPresence(callback) {
    this.presenceCallbacks.push(callback);
    return () => {
      const index = this.presenceCallbacks.indexOf(callback);
      if (index > -1) {
        this.presenceCallbacks.splice(index, 1);
      }
    };
  }
  async getPresence() {
    try {
      const response = await this.httpClient.realtimeGetPresence(this.projectId, this.channelName);
      return response.data.users || [];
    } catch (error) {
      throw new BlinkRealtimeError(
        `Failed to get presence for channel ${this.channelName}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  async getMessages(options = {}) {
    try {
      const response = await this.httpClient.realtimeGetMessages(this.projectId, {
        channel: this.channelName,
        limit: options.limit,
        start: options.after || "-",
        end: options.before || "+"
      });
      return response.data.messages || [];
    } catch (error) {
      throw new BlinkRealtimeError(
        `Failed to get messages for channel ${this.channelName}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  cleanup() {
    this.isSubscribed = false;
    this.subscribeOptions = {};
    this.messageCallbacks = [];
    this.presenceCallbacks = [];
  }
};
var BlinkRealtimeImpl = class {
  constructor(httpClient, projectId) {
    this.httpClient = httpClient;
    this.projectId = projectId;
    this.connection = new RealtimeConnection(httpClient, projectId);
  }
  connection;
  channels = /* @__PURE__ */ new Map();
  handlers = {};
  channel(name) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new BlinkRealtimeChannel(name, this.connection, this.httpClient, this.projectId));
    }
    return this.channels.get(name);
  }
  async subscribe(channelName, callback, options = {}) {
    const channel = this.channel(channelName);
    await channel.subscribe(options);
    const state = this.handlers[channelName] ??= {
      msgHandlers: /* @__PURE__ */ new Set(),
      presHandlers: /* @__PURE__ */ new Set(),
      subscribed: true
    };
    state.msgHandlers.add(callback);
    const messageUnsub = channel.onMessage(callback);
    return () => {
      messageUnsub();
      state.msgHandlers.delete(callback);
      if (state.msgHandlers.size === 0 && state.presHandlers.size === 0) {
        channel.unsubscribe();
        delete this.handlers[channelName];
      }
    };
  }
  async publish(channelName, type, data, options = {}) {
    const channel = this.channel(channelName);
    return channel.publish(type, data, options);
  }
  async presence(channelName) {
    const channel = this.channel(channelName);
    return channel.getPresence();
  }
  onPresence(channelName, callback) {
    const channel = this.channel(channelName);
    const state = this.handlers[channelName] ??= {
      msgHandlers: /* @__PURE__ */ new Set(),
      presHandlers: /* @__PURE__ */ new Set(),
      subscribed: false
    };
    state.presHandlers.add(callback);
    const presenceUnsub = channel.onPresence(callback);
    return () => {
      presenceUnsub();
      state.presHandlers.delete(callback);
      if (state.msgHandlers.size === 0 && state.presHandlers.size === 0) {
        channel.unsubscribe();
        delete this.handlers[channelName];
      }
    };
  }
  /**
   * Get the number of active WebSocket connections (should always be 0 or 1)
   */
  getConnectionCount() {
    return this.connection.isReady() ? 1 : 0;
  }
  /**
   * Get the number of active channels
   */
  getChannelCount() {
    return this.connection.getChannelCount();
  }
};
var BlinkNotificationsImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * Sends an email using the Blink Notifications API.
   *
   * If the project has a verified custom email domain (Settings → Email),
   * the message is sent via that domain through AWS SES. Otherwise it
   * goes through the default Blink sending infrastructure on a project
   * subdomain (`noreply@{projectId}.blink-email.com`).
   *
   * @param params - An object containing the details for the email.
   *   - `to`: The recipient's email address or an array of addresses.
   *   - `subject`: The subject line of the email.
   *   - `html`: The HTML body of the email. For best results across all email
   *             clients (like Gmail, Outlook), use inline CSS and table-based
   *             layouts.
   *   - `text`: A plain-text version of the email body (optional).
   *   - `from`: Pick which sender to use (optional).
   *             Two shapes are accepted — the server disambiguates by
   *             whether the value contains an `@`:
   *               • **Full address** like `"support@mail.acme.com"` (any
   *                 string with `@`) — sends from that specific verified
   *                 sender. The address must be added in Settings → Email
   *                 first; unverified addresses are rejected (HTTP 403,
   *                 `UNVERIFIED_SENDER`).
   *               • **Display name** like `"Acme Support"` (no `@`) —
   *                 keeps the project's default sender address, only
   *                 overrides the visible name in the recipient's inbox.
   *             So a display name MUST NOT contain `@`, or the server
   *             treats it as an address and 403s if unverified.
   *             Omit to use the project's default sender (same one auth
   *             flows like password reset use).
   *   - `replyTo`: An email address for recipients to reply to (optional).
   *   - `cc`: A CC recipient's email address or an array of addresses (optional).
   *   - `bcc`: A BCC recipient's email address or an array of addresses (optional).
   *   - `attachments`: An array of `SendEmailAttachment` objects. Each
   *                    REQUIRES `filename`, `url`, AND `type` (the MIME
   *                    type — e.g. `'image/png'`, `'application/pdf'`).
   *                    Missing any of the three returns a 400. The file at
   *                    the URL is fetched server-side and attached.
   *
   *                    **Interaction with `from`:** AWS SES can't carry
   *                    attachments in the simple body type we use, so any
   *                    request with `attachments` is delivered through the
   *                    fallback transport instead of the project's verified
   *                    SES domain. The `from` field is still honored in the
   *                    From header — i.e. recipients of an attachment email
   *                    still see `support@mail.acme.com` if you passed that —
   *                    but the signing/sending domain in the headers will be
   *                    the Blink subdomain. Gmail may render a small "via
   *                    blink-email.com" annotation on these messages, and
   *                    SPF/DKIM won't align to your verified domain.
   *                    Attachment-free sends are not affected.
   *
   * @example Basic transactional send — uses the project's default sender.
   * ```ts
   * await blink.notifications.email({
   *   to: 'customer@example.com',
   *   subject: 'Your order has shipped',
   *   html: '<h1>Order Confirmation</h1><p>Your order #12345 is on its way.</p>',
   * });
   * ```
   *
   * @example Send from a specific verified sender (set up in Settings → Email).
   * ```ts
   * await blink.notifications.email({
   *   to: 'customer@example.com',
   *   from: 'support@mail.acme.com',
   *   replyTo: 'support@mail.acme.com',
   *   subject: 'Re: your ticket #2891',
   *   html: '<p>Hi! Following up on your support request…</p>',
   * });
   *
   * await blink.notifications.email({
   *   to: 'customer@example.com',
   *   from: 'billing@mail.acme.com',
   *   subject: 'Your invoice for May',
   *   html: '<p>Your monthly invoice is ready.</p>',
   * });
   * ```
   *
   * @example Display-name override on top of the default sender.
   * ```ts
   * await blink.notifications.email({
   *   to: 'customer@example.com',
   *   from: 'Acme Receipts',         // not an email — display name only
   *   subject: 'Payment received',
   *   html: '<p>Thanks for your payment.</p>',
   * });
   * ```
   *
   * @example Cron-driven digest from a dedicated sender.
   * ```ts
   * await blink.notifications.email({
   *   to: user.email,
   *   from: 'digest@mail.acme.com',
   *   subject: 'Your weekly Acme summary',
   *   html: renderDigestHtml(user),
   * });
   * ```
   *
   * @returns A promise that resolves with an object containing:
   *   - `success`: Whether the email was accepted for delivery.
   *   - `messageId`: The unique ID of the message from the email provider.
   *
   * @throws {BlinkNotificationsError} On any send failure. The thrown error's
   *   `.code` is always `'NOTIFICATIONS_ERROR'` (the SDK-level category).
   *   Inspect `.status` and `.details` for the specific server reason:
   *
   *   - `err.status === 403 && err.details?.code === 'UNVERIFIED_SENDER'` —
   *     the `from` address you passed is not a verified sender for this
   *     project. Add it in Settings → Email or pick one of the project's
   *     existing verified addresses.
   *
   *   Example:
   *   ```ts
   *   try {
   *     await blink.notifications.email({ to, subject, html, from: 'foo@x.com' });
   *   } catch (err) {
   *     if (err instanceof BlinkNotificationsError &&
   *         err.status === 403 &&
   *         (err.details as { code?: string })?.code === 'UNVERIFIED_SENDER') {
   *       // surface a friendly "this sender isn't set up yet" message
   *     } else {
   *       throw err;
   *     }
   *   }
   *   ```
   */
  async email(params) {
    try {
      if (!params.to || !params.subject || !params.html && !params.text) {
        throw new BlinkNotificationsError('The "to", "subject", and either "html" or "text" fields are required.');
      }
      const response = await this.httpClient.post(`/api/notifications/${this.httpClient.projectId}/email`, params);
      if (!response.data || typeof response.data.success !== "boolean") {
        throw new BlinkNotificationsError("Invalid response from email API");
      }
      return response.data;
    } catch (error) {
      if (error instanceof BlinkNotificationsError) {
        throw error;
      }
      const status = error.status ?? error.response?.status;
      let details = error.details;
      if (!details && error.response?.data) {
        const d = error.response.data;
        details = d?.code ? { code: d.code, message: d.message ?? d.error } : d;
      }
      const errorMessage = details?.message ?? error.message ?? "An unknown error occurred";
      throw new BlinkNotificationsError(
        `Failed to send email: ${errorMessage}`,
        status,
        details
      );
    }
  }
};
var SESSION_DURATION = 30 * 60 * 1e3;
var MAX_BATCH_SIZE = 10;
var BATCH_TIMEOUT = 3e3;
var MAX_STRING_LENGTH = 256;
var BlinkAnalyticsImpl = class {
  httpClient;
  projectId;
  queue = [];
  timer = null;
  enabled = true;
  userId = null;
  userEmail = null;
  hasTrackedPageview = false;
  utmParams = {};
  persistedAttribution = {};
  constructor(httpClient, projectId) {
    this.httpClient = httpClient;
    this.projectId = projectId;
    if (!isWeb) {
      this.enabled = false;
      return;
    }
    if (navigator.doNotTrack === "1") {
      this.enabled = false;
      return;
    }
    this.loadPersistedAttribution();
    this.captureUTMParams();
    this.loadQueue();
    if (typeof window !== "undefined" && window.__BLINK_ANALYTICS_PRESENT) {
      this.hasTrackedPageview = true;
    }
    this.trackPageview();
    this.setupRouteChangeListener();
    this.setupUnloadListener();
  }
  /**
   * Generate project-scoped storage key for analytics
   */
  getStorageKey(suffix) {
    return `blinkAnalytics${suffix}_${this.projectId}`;
  }
  /**
   * Log a custom analytics event
   */
  log(eventName, data = {}) {
    if (!this.enabled || !isWeb) {
      return;
    }
    const event = this.buildEvent(eventName, data);
    this.enqueue(event);
  }
  /**
   * Disable analytics tracking
   */
  disable() {
    this.enabled = false;
    this.clearTimer();
  }
  /**
   * Cleanup analytics instance (remove from global tracking)
   */
  destroy() {
    this.disable();
    if (typeof window !== "undefined") {
      window.__blinkAnalyticsInstances?.delete(this);
    }
  }
  /**
   * Enable analytics tracking
   */
  enable() {
    this.enabled = true;
  }
  /**
   * Check if analytics is enabled
   */
  isEnabled() {
    return this.enabled;
  }
  /**
   * Set the user ID for analytics events
   */
  setUserId(userId) {
    this.userId = userId;
  }
  /**
   * Set the user email for analytics events
   */
  setUserEmail(email) {
    this.userEmail = email;
  }
  /**
   * Clear persisted attribution data
   */
  clearAttribution() {
    this.persistedAttribution = {};
    try {
      localStorage.removeItem(this.getStorageKey("Attribution"));
    } catch {
    }
  }
  // Private methods
  buildEvent(type, data = {}) {
    const sessionId = this.getOrCreateSessionId();
    const channel = this.detectChannel();
    return {
      type,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      project_id: this.projectId,
      user_id: this.userId,
      user_email: this.userEmail,
      session_id: sessionId,
      pathname: getLocationPathname(),
      referrer: getDocumentReferrer(),
      screen_width: getWindowInnerWidth(),
      channel,
      utm_source: this.utmParams.utm_source || this.persistedAttribution.utm_source || null,
      utm_medium: this.utmParams.utm_medium || this.persistedAttribution.utm_medium || null,
      utm_campaign: this.utmParams.utm_campaign || this.persistedAttribution.utm_campaign || null,
      utm_content: this.utmParams.utm_content || this.persistedAttribution.utm_content || null,
      utm_term: this.utmParams.utm_term || this.persistedAttribution.utm_term || null,
      ...this.sanitizeData(data)
    };
  }
  sanitizeData(data) {
    if (typeof data === "string") {
      return data.length > MAX_STRING_LENGTH ? data.slice(0, MAX_STRING_LENGTH - 3) + "..." : data;
    }
    if (typeof data === "object" && data !== null) {
      const result = {};
      for (const key in data) {
        result[key] = this.sanitizeData(data[key]);
      }
      return result;
    }
    return data;
  }
  enqueue(event) {
    this.queue.push(event);
    this.persistQueue();
    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), BATCH_TIMEOUT);
    }
  }
  async flush() {
    this.clearTimer();
    if (this.queue.length === 0) {
      return;
    }
    const events = this.queue.slice(0, MAX_BATCH_SIZE);
    this.queue = this.queue.slice(MAX_BATCH_SIZE);
    this.persistQueue();
    try {
      await this.httpClient.post(`/api/analytics/${this.projectId}/log`, { events });
    } catch (error) {
      this.queue = [...events, ...this.queue];
      this.persistQueue();
    }
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => this.flush(), BATCH_TIMEOUT);
    }
  }
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  getOrCreateSessionId() {
    try {
      const stored = localStorage.getItem(this.getStorageKey("Session"));
      if (stored) {
        const session = JSON.parse(stored);
        const now = Date.now();
        if (now - session.lastActivityAt > SESSION_DURATION) {
          return this.createNewSession();
        }
        session.lastActivityAt = now;
        localStorage.setItem(this.getStorageKey("Session"), JSON.stringify(session));
        return session.id;
      }
      return this.createNewSession();
    } catch {
      return null;
    }
  }
  createNewSession() {
    const now = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const session = {
      id: `sess_${now}_${randomId}`,
      startedAt: now,
      lastActivityAt: now
    };
    try {
      localStorage.setItem(this.getStorageKey("Session"), JSON.stringify(session));
    } catch {
    }
    return session.id;
  }
  loadQueue() {
    try {
      const stored = localStorage.getItem(this.getStorageKey("Queue"));
      if (stored) {
        this.queue = JSON.parse(stored);
        if (this.queue.length > 0) {
          this.timer = setTimeout(() => this.flush(), BATCH_TIMEOUT);
        }
      }
    } catch {
      this.queue = [];
    }
  }
  persistQueue() {
    try {
      if (this.queue.length === 0) {
        localStorage.removeItem(this.getStorageKey("Queue"));
      } else {
        localStorage.setItem(this.getStorageKey("Queue"), JSON.stringify(this.queue));
      }
    } catch {
    }
  }
  trackPageview() {
    if (!this.hasTrackedPageview) {
      this.log("pageview");
      this.hasTrackedPageview = true;
    }
  }
  setupRouteChangeListener() {
    if (!isWeb) return;
    if (!window.__blinkAnalyticsSetup) {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      const analyticsInstances = /* @__PURE__ */ new Set();
      window.__blinkAnalyticsInstances = analyticsInstances;
      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        analyticsInstances.forEach((instance) => {
          if (instance.isEnabled()) {
            instance.log("pageview");
          }
        });
      };
      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        analyticsInstances.forEach((instance) => {
          if (instance.isEnabled()) {
            instance.log("pageview");
          }
        });
      };
      window.addEventListener("popstate", () => {
        analyticsInstances.forEach((instance) => {
          if (instance.isEnabled()) {
            instance.log("pageview");
          }
        });
      });
      window.__blinkAnalyticsSetup = true;
    }
    window.__blinkAnalyticsInstances?.add(this);
  }
  setupUnloadListener() {
    if (!isWeb || !hasWindow()) return;
    window.addEventListener("pagehide", () => {
      this.flush();
    });
    window.addEventListener("unload", () => {
      this.flush();
    });
  }
  captureUTMParams() {
    if (!isWeb) return;
    const search = getLocationSearch();
    if (!search) {
      this.utmParams = {};
      return;
    }
    const urlParams = new URLSearchParams(search);
    this.utmParams = {
      utm_source: urlParams.get("utm_source"),
      utm_medium: urlParams.get("utm_medium"),
      utm_campaign: urlParams.get("utm_campaign"),
      utm_content: urlParams.get("utm_content"),
      utm_term: urlParams.get("utm_term")
    };
    const hasNewParams = Object.values(this.utmParams).some((v) => v !== null);
    if (hasNewParams) {
      this.persistAttribution();
    }
  }
  loadPersistedAttribution() {
    try {
      const stored = localStorage.getItem(this.getStorageKey("Attribution"));
      if (stored) {
        this.persistedAttribution = JSON.parse(stored);
      }
    } catch {
      this.persistedAttribution = {};
    }
  }
  persistAttribution() {
    try {
      const attribution = {
        ...this.persistedAttribution,
        ...Object.fromEntries(
          Object.entries(this.utmParams).filter(([_, v]) => v !== null)
        )
      };
      localStorage.setItem(this.getStorageKey("Attribution"), JSON.stringify(attribution));
      this.persistedAttribution = attribution;
    } catch {
    }
  }
  detectChannel() {
    const referrer = getDocumentReferrer();
    const utmMedium = this.utmParams.utm_medium;
    this.utmParams.utm_source;
    if (utmMedium) {
      if (utmMedium === "cpc" || utmMedium === "ppc") return "Paid Search";
      if (utmMedium === "email") return "Email";
      if (utmMedium === "social") return "Social";
      if (utmMedium === "referral") return "Referral";
      if (utmMedium === "display") return "Display";
      if (utmMedium === "affiliate") return "Affiliate";
    }
    if (!referrer) return "Direct";
    try {
      const referrerUrl = new URL(referrer);
      const referrerDomain = referrerUrl.hostname.toLowerCase();
      if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\./.test(referrerDomain)) {
        return "Organic Search";
      }
      if (/facebook\.|twitter\.|linkedin\.|instagram\.|youtube\.|tiktok\.|reddit\./.test(referrerDomain)) {
        return "Social";
      }
      if (/mail\.|outlook\.|gmail\./.test(referrerDomain)) {
        return "Email";
      }
      return "Referral";
    } catch {
      return "Direct";
    }
  }
};
var BlinkConnectorsImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  async status(provider, options) {
    const response = await this.httpClient.connectorStatus(provider);
    return response.data;
  }
  async execute(provider, request) {
    const response = await this.httpClient.connectorExecute(provider, request);
    return response.data;
  }
  async saveApiKey(provider, request) {
    const response = await this.httpClient.connectorSaveApiKey(provider, request);
    return response.data;
  }
};
var BlinkFunctionsImpl = class {
  httpClient;
  projectId;
  getToken;
  constructor(httpClient, projectId, getToken) {
    this.httpClient = httpClient;
    this.projectId = projectId;
    this.getToken = getToken;
  }
  /**
   * Get the project suffix from the full project ID.
   * Project IDs are formatted as: prj_xxxxx
   * The suffix is the last 8 characters used in function URLs.
   */
  getProjectSuffix() {
    return this.projectId.slice(-8);
  }
  /**
   * Build the full function URL using CF Workers format.
   */
  buildFunctionUrl(functionSlug, searchParams) {
    const suffix = this.getProjectSuffix();
    const baseUrl = `https://${suffix}.backend.blink.new/${functionSlug}`;
    if (!searchParams || Object.keys(searchParams).length === 0) {
      return baseUrl;
    }
    const url = new URL(baseUrl);
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }
  async invoke(functionSlug, options = {}) {
    const { method = "POST", body, headers = {}, searchParams } = options;
    const url = this.buildFunctionUrl(functionSlug, searchParams);
    const token = await this.getToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await this.httpClient.request(url, {
      method,
      body,
      headers: { ...authHeaders, ...headers }
    });
    return { data: res.data, status: res.status, headers: res.headers };
  }
};
function removeUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== void 0)
  );
}
function convertCollection(api) {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    embeddingModel: api.embedding_model,
    embeddingDimensions: api.embedding_dimensions,
    indexMetric: api.index_metric,
    chunkMaxTokens: api.chunk_max_tokens,
    chunkOverlapTokens: api.chunk_overlap_tokens,
    documentCount: api.document_count,
    chunkCount: api.chunk_count,
    shared: api.shared,
    createdAt: api.created_at,
    updatedAt: api.updated_at
  };
}
function convertDocument(api) {
  return {
    id: api.id,
    collectionId: api.collection_id,
    filename: api.filename,
    sourceType: api.source_type,
    sourceUrl: api.source_url,
    contentType: api.content_type,
    fileSize: api.file_size,
    status: api.status,
    errorMessage: api.error_message,
    processingStartedAt: api.processing_started_at,
    processingCompletedAt: api.processing_completed_at,
    chunkCount: api.chunk_count,
    tokenCount: api.token_count,
    metadata: api.metadata,
    createdAt: api.created_at,
    updatedAt: api.updated_at
  };
}
function convertPartialDocument(api, options) {
  let sourceType = "text";
  if (options.url) sourceType = "url";
  if (options.file) sourceType = "file";
  return {
    id: api.id || "",
    collectionId: api.collection_id || options.collectionId || "",
    filename: api.filename || options.filename,
    sourceType: api.source_type || sourceType,
    sourceUrl: api.source_url ?? options.url ?? null,
    contentType: api.content_type ?? options.file?.contentType ?? null,
    fileSize: api.file_size ?? null,
    status: api.status || "pending",
    errorMessage: api.error_message ?? null,
    processingStartedAt: api.processing_started_at ?? null,
    processingCompletedAt: api.processing_completed_at ?? null,
    chunkCount: api.chunk_count ?? 0,
    tokenCount: api.token_count ?? null,
    metadata: api.metadata || options.metadata || {},
    createdAt: api.created_at || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: api.updated_at || api.created_at || (/* @__PURE__ */ new Date()).toISOString()
  };
}
function convertSearchResult(api) {
  return {
    chunkId: api.chunk_id,
    documentId: api.document_id,
    filename: api.filename,
    content: api.content,
    score: api.score,
    chunkIndex: api.chunk_index,
    metadata: api.metadata
  };
}
function convertSearchResponse(api) {
  return {
    results: api.results.map(convertSearchResult),
    query: api.query,
    collectionId: api.collection_id,
    totalResults: api.total_results
  };
}
function convertAISearchSource(api) {
  return {
    documentId: api.document_id,
    filename: api.filename,
    chunkId: api.chunk_id,
    excerpt: api.excerpt,
    score: api.score
  };
}
function convertAISearchResult(api) {
  return {
    answer: api.answer,
    sources: api.sources.map(convertAISearchSource),
    query: api.query,
    model: api.model,
    usage: {
      inputTokens: api.usage.input_tokens,
      outputTokens: api.usage.output_tokens
    }
  };
}
var BlinkRAGImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.projectId = httpClient.projectId;
  }
  projectId;
  /**
   * Build URL with project_id prefix
   */
  url(path) {
    return `/api/rag/${this.projectId}${path}`;
  }
  // ============================================================================
  // Collections
  // ============================================================================
  /**
   * Create a new RAG collection
   */
  async createCollection(options) {
    const body = removeUndefined({
      name: options.name,
      description: options.description,
      embedding_model: options.embeddingModel,
      embedding_dimensions: options.embeddingDimensions,
      index_metric: options.indexMetric,
      chunk_max_tokens: options.chunkMaxTokens,
      chunk_overlap_tokens: options.chunkOverlapTokens,
      shared: options.shared
    });
    const response = await this.httpClient.post(this.url("/collections"), body);
    return convertCollection(response.data);
  }
  /**
   * List all collections accessible to the current user
   */
  async listCollections() {
    const response = await this.httpClient.get(this.url("/collections"));
    return response.data.collections.map(convertCollection);
  }
  /**
   * Get a specific collection by ID
   */
  async getCollection(collectionId) {
    const response = await this.httpClient.get(this.url(`/collections/${collectionId}`));
    return convertCollection(response.data);
  }
  /**
   * Delete a collection and all its documents
   */
  async deleteCollection(collectionId) {
    await this.httpClient.delete(this.url(`/collections/${collectionId}`));
  }
  // ============================================================================
  // Documents
  // ============================================================================
  /**
   * Upload a document for processing
   * 
   * @example
   * // Upload text content
   * const doc = await blink.rag.upload({
   *   collectionName: 'docs',
   *   filename: 'notes.txt',
   *   content: 'My document content...'
   * })
   * 
   * @example
   * // Upload from URL
   * const doc = await blink.rag.upload({
   *   collectionId: 'col_abc123',
   *   filename: 'article.html',
   *   url: 'https://example.com/article'
   * })
   * 
   * @example
   * // Upload a file (base64)
   * const doc = await blink.rag.upload({
   *   collectionName: 'docs',
   *   filename: 'report.pdf',
   *   file: { data: base64Data, contentType: 'application/pdf' }
   * })
   */
  async upload(options) {
    if (!options.collectionId && !options.collectionName) {
      throw new Error("collectionId or collectionName is required");
    }
    const body = removeUndefined({
      collection_id: options.collectionId,
      collection_name: options.collectionName,
      filename: options.filename,
      content: options.content,
      url: options.url,
      metadata: options.metadata
    });
    if (options.file) {
      body.file = {
        data: options.file.data,
        content_type: options.file.contentType
      };
    }
    const response = await this.httpClient.post(this.url("/documents"), body);
    return convertPartialDocument(response.data, options);
  }
  /**
   * Get document status and metadata
   */
  async getDocument(documentId) {
    const response = await this.httpClient.get(this.url(`/documents/${documentId}`));
    return convertDocument(response.data);
  }
  /**
   * List documents, optionally filtered by collection or status
   */
  async listDocuments(options) {
    const params = {};
    if (options?.collectionId) params.collection_id = options.collectionId;
    if (options?.status) params.status = options.status;
    const queryString = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await this.httpClient.get(
      this.url(`/documents${queryString}`)
    );
    return response.data.documents.map(convertDocument);
  }
  /**
   * Delete a document and its chunks
   */
  async deleteDocument(documentId) {
    await this.httpClient.delete(this.url(`/documents/${documentId}`));
  }
  /**
   * Wait for a document to finish processing
   * 
   * @example
   * const doc = await blink.rag.upload({ ... })
   * const readyDoc = await blink.rag.waitForReady(doc.id)
   * console.log(`Processed ${readyDoc.chunkCount} chunks`)
   */
  async waitForReady(documentId, options) {
    const { timeoutMs = 12e4, pollIntervalMs = 2e3 } = options || {};
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const doc = await this.getDocument(documentId);
      if (doc.status === "ready") {
        return doc;
      }
      if (doc.status === "error") {
        throw new Error(`Document processing failed: ${doc.errorMessage}`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error(`Document processing timeout after ${timeoutMs}ms`);
  }
  // ============================================================================
  // Search
  // ============================================================================
  /**
   * Search for similar chunks using vector similarity
   * 
   * @example
   * const results = await blink.rag.search({
   *   collectionName: 'docs',
   *   query: 'How do I configure authentication?',
   *   maxResults: 5
   * })
   */
  async search(options) {
    if (!options.collectionId && !options.collectionName) {
      throw new Error("collectionId or collectionName is required");
    }
    const body = removeUndefined({
      collection_id: options.collectionId,
      collection_name: options.collectionName,
      query: options.query,
      max_results: options.maxResults,
      score_threshold: options.scoreThreshold,
      filters: options.filters,
      include_content: options.includeContent
    });
    const response = await this.httpClient.post(this.url("/search"), body);
    return convertSearchResponse(response.data);
  }
  async aiSearch(options) {
    if (!options.collectionId && !options.collectionName) {
      throw new Error("collectionId or collectionName is required");
    }
    const body = removeUndefined({
      collection_id: options.collectionId,
      collection_name: options.collectionName,
      query: options.query,
      model: options.model,
      max_context_chunks: options.maxContextChunks,
      score_threshold: options.scoreThreshold,
      system_prompt: options.systemPrompt,
      stream: options.stream
    });
    if (options.stream) {
      const response2 = await this.httpClient.ragAiSearchStream(body, options.signal);
      return response2.body;
    }
    const response = await this.httpClient.post(this.url("/ai-search"), body);
    return convertAISearchResult(response.data);
  }
};
var SandboxConnectionError = class extends Error {
  sandboxId;
  constructor(sandboxId, cause) {
    super(`Failed to connect to sandbox ${sandboxId}`);
    this.name = "SandboxConnectionError";
    this.sandboxId = sandboxId;
    if (cause) {
      this.cause = cause;
    }
  }
};
var SandboxImpl = class {
  constructor(id, template, hostPattern) {
    this.id = id;
    this.template = template;
    this.hostPattern = hostPattern;
  }
  getHost(port) {
    return this.hostPattern.replace("{port}", String(port));
  }
};
var MAX_RETRIES = 3;
var INITIAL_RETRY_DELAY_MS = 250;
var BlinkSandboxImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.projectId = httpClient.projectId;
  }
  projectId;
  /**
   * Build URL with project_id prefix
   */
  url(path) {
    return `/api/sandbox/${this.projectId}${path}`;
  }
  async create(options = {}) {
    const body = {
      template: options.template,
      timeout_ms: options.timeoutMs,
      metadata: options.metadata,
      secrets: options.secrets
    };
    const response = await this.httpClient.post(this.url("/create"), body);
    const { id, template, host_pattern } = response.data;
    return new SandboxImpl(id, template, host_pattern);
  }
  async connect(sandboxId, options = {}) {
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const body = {
          sandbox_id: sandboxId,
          timeout_ms: options.timeoutMs
        };
        const response = await this.httpClient.post(this.url("/connect"), body);
        const { id, template, host_pattern } = response.data;
        return new SandboxImpl(id, template, host_pattern);
      } catch (error) {
        console.error(`[Sandbox] Connect attempt ${attempt + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        if (lastError.message.includes("404") || lastError.message.includes("not found") || lastError.message.includes("unauthorized")) {
          throw new SandboxConnectionError(sandboxId, lastError);
        }
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.error(`[Sandbox] All ${MAX_RETRIES} connection attempts failed for sandbox ${sandboxId}`);
    throw new SandboxConnectionError(sandboxId, lastError);
  }
  async kill(sandboxId) {
    await this.httpClient.post(this.url("/kill"), { sandbox_id: sandboxId });
  }
};
var BlinkQueueCreditError = class extends Error {
  code = "INSUFFICIENT_CREDITS";
  constructor() {
    super("Insufficient credits to enqueue task. Add credits at https://blink.new/settings?tab=billing");
    this.name = "BlinkQueueCreditError";
  }
};
var BlinkQueueImpl = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  get basePath() {
    return `/api/queue/${this.httpClient.projectId}`;
  }
  async enqueue(taskName, payload, options) {
    return this.httpClient.post(
      `${this.basePath}/enqueue`,
      { taskName, payload, options }
    ).then((res) => res.data).catch((err) => {
      if (err?.status === 402) throw new BlinkQueueCreditError();
      throw err;
    });
  }
  async list(filter) {
    const params = {};
    if (filter?.status) params.status = filter.status;
    if (filter?.queue) params.queue = filter.queue;
    if (filter?.limit) params.limit = String(filter.limit);
    const res = await this.httpClient.get(`${this.basePath}/tasks`, params);
    return res.data.tasks;
  }
  async get(taskId) {
    const res = await this.httpClient.get(`${this.basePath}/tasks/${taskId}`);
    return res.data;
  }
  async cancel(taskId) {
    await this.httpClient.delete(`${this.basePath}/tasks/${taskId}`);
  }
  async schedule(name, cron, payload, options) {
    const res = await this.httpClient.post(
      `${this.basePath}/schedule`,
      { name, cron, payload, options }
    );
    return res.data;
  }
  async listSchedules() {
    const res = await this.httpClient.get(`${this.basePath}/schedules`);
    return res.data.schedules;
  }
  async pauseSchedule(name) {
    await this.httpClient.post(`${this.basePath}/schedules/${encodeURIComponent(name)}/pause`);
  }
  async resumeSchedule(name) {
    await this.httpClient.post(`${this.basePath}/schedules/${encodeURIComponent(name)}/resume`);
  }
  async deleteSchedule(name) {
    await this.httpClient.delete(`${this.basePath}/schedules/${encodeURIComponent(name)}`);
  }
  async createQueue(name, options) {
    await this.httpClient.post(`${this.basePath}/queues`, { name, ...options });
  }
  async listQueues() {
    const res = await this.httpClient.get(`${this.basePath}/queues`);
    return res.data.queues;
  }
  async deleteQueue(name) {
    await this.httpClient.delete(`${this.basePath}/queues/${encodeURIComponent(name)}`);
  }
  async listDead() {
    const res = await this.httpClient.get(`${this.basePath}/dlq`);
    return res.data.messages;
  }
  async retryDead(dlqId) {
    const res = await this.httpClient.post(`${this.basePath}/dlq/${dlqId}/retry`);
    return res.data;
  }
  async purgeDead() {
    await this.httpClient.delete(`${this.basePath}/dlq`);
  }
  async stats() {
    const res = await this.httpClient.get(`${this.basePath}/stats`);
    return res.data;
  }
};
var defaultClient = null;
function getDefaultClient() {
  if (!defaultClient) {
    throw new Error(
      "No Blink client initialized. Call createClient() first before using Agent or other SDK features."
    );
  }
  return defaultClient;
}
function _getDefaultHttpClient() {
  return getDefaultClient()._httpClient;
}
var BlinkClientImpl = class {
  /** Echoed from config so callers (e.g. `<BlinkProvider projectId={blink.projectId}>`) can read it. */
  projectId;
  publishableKey;
  auth;
  db;
  storage;
  ai;
  data;
  realtime;
  notifications;
  analytics;
  connectors;
  functions;
  rag;
  sandbox;
  queue;
  /** @internal HTTP client for Agent auto-binding */
  _httpClient;
  constructor(config) {
    if ((config.secretKey || config.serviceToken) && isBrowser) {
      throw new Error("secretKey/serviceToken is server-only. Do not provide it in browser/React Native clients.");
    }
    this.projectId = config.projectId;
    this.publishableKey = config.publishableKey;
    this.auth = new BlinkAuth(config);
    this._httpClient = new HttpClient(
      config,
      () => this.auth.getToken(),
      () => this.auth.getValidToken(),
      () => this.auth.forceRefreshAccessToken()
    );
    this.db = new BlinkDatabase(this._httpClient);
    this.storage = new BlinkStorageImpl(this._httpClient);
    this.ai = new BlinkAIImpl(this._httpClient);
    this.data = new BlinkDataImpl(this._httpClient, config.projectId);
    this.realtime = new BlinkRealtimeImpl(this._httpClient, config.projectId);
    this.notifications = new BlinkNotificationsImpl(this._httpClient);
    this.analytics = new BlinkAnalyticsImpl(this._httpClient, config.projectId);
    this.connectors = new BlinkConnectorsImpl(this._httpClient);
    this.functions = new BlinkFunctionsImpl(
      this._httpClient,
      config.projectId,
      () => this.auth.getValidToken()
    );
    this.rag = new BlinkRAGImpl(this._httpClient);
    this.sandbox = new BlinkSandboxImpl(this._httpClient);
    this.queue = new BlinkQueueImpl(this._httpClient);
    this.auth.onAuthStateChanged((state) => {
      if (state.isAuthenticated && state.user) {
        this.analytics.setUserId(state.user.id);
        this.analytics.setUserEmail(state.user.email);
      } else {
        this.analytics.setUserId(null);
        this.analytics.setUserEmail(null);
      }
    });
  }
};
function createClient(config) {
  if (!config.projectId) {
    throw new Error("projectId is required");
  }
  const client = new BlinkClientImpl(config);
  defaultClient = client;
  return client;
}

// server/native/bootstrap.ts
var statements = [{ "sql": `CREATE TABLE IF NOT EXISTS "app_config" (
 "app_name" TEXT DEFAULT 'ImobFlow AI',
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "super_admin_emails" TEXT NOT NULL DEFAULT '[]',
 "system_settings" TEXT DEFAULT '{}',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);` }, { "sql": `CREATE TABLE IF NOT EXISTS "commission" (
 "company_id" TEXT NOT NULL,
 "corretor_id" TEXT NOT NULL,
 "corretor_nome" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "date" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "notes" TEXT,
 "payment_status" TEXT NOT NULL DEFAULT 'pendente',
 "percentage" REAL DEFAULT 0 CHECK("percentage" BETWEEN 0 AND 100),
 "property_id" TEXT,
 "proposal_id" TEXT,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "value" REAL NOT NULL CHECK("value" IS NULL OR "value">=0)
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_commission_company_id ON commission(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_commission_date ON commission(date);" }, { "sql": `CREATE TABLE IF NOT EXISTS "company" (
 "cnpj" TEXT,
 "cor_primaria" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "creci" TEXT,
 "email" TEXT,
 "endereco" TEXT DEFAULT '{}',
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "logo_url" TEXT,
 "name" TEXT NOT NULL,
 "owner_email" TEXT,
 "owner_nome" TEXT,
 "owner_telefone" TEXT,
 "plano" TEXT NOT NULL DEFAULT 'starter',
 "settings" TEXT NOT NULL DEFAULT '{}',
 "slug" TEXT UNIQUE,
 "status" TEXT NOT NULL DEFAULT 'trial',
 "telefone" TEXT,
 "trial_ate" TEXT,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);` }, { "sql": `CREATE TABLE IF NOT EXISTS "company_user" (
 "ativo" BOOLEAN NOT NULL DEFAULT 1,
 "comissao_pct" REAL NOT NULL DEFAULT '50' CHECK("comissao_pct" BETWEEN 0 AND 100),
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "creci" TEXT,
 "email" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "must_change_password" BOOLEAN NOT NULL DEFAULT '0',
 "nome" TEXT,
 "role" TEXT NOT NULL DEFAULT 'corretor',
 "ultimo_login" TEXT,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "user_id" TEXT
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_company_user_company_id ON company_user(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_company_user_user_id ON company_user(user_id);" }, { "sql": `CREATE TABLE IF NOT EXISTS "lead" (
 "assigned_to" TEXT,
 "bedrooms_min" REAL DEFAULT 0,
 "budget_max" REAL DEFAULT 0 CHECK("budget_max" IS NULL OR "budget_max">=0),
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "email" TEXT,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "interest_property_id" TEXT,
 "interest_type" TEXT,
 "lost_reason" TEXT,
 "name" TEXT NOT NULL,
 "neighborhoods" TEXT DEFAULT '[]',
 "notes" TEXT,
 "phone" TEXT NOT NULL,
 "source" TEXT NOT NULL DEFAULT 'manual',
 "status" TEXT NOT NULL DEFAULT 'novo',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_lead_company_id ON lead(company_id);" }, { "sql": `CREATE TABLE IF NOT EXISTS "operational_cost" (
 "amount" REAL NOT NULL CHECK("amount" IS NULL OR "amount">=0),
 "category" TEXT,
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "date" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "payment_status" TEXT NOT NULL DEFAULT 'pendente',
 "recurring" BOOLEAN NOT NULL DEFAULT '0',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_operational_cost_company_id ON operational_cost(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_operational_cost_date ON operational_cost(date);" }, { "sql": `CREATE TABLE IF NOT EXISTS "property" (
 "address" TEXT NOT NULL DEFAULT '{}',
 "area_total" REAL DEFAULT 0,
 "area_useful" REAL DEFAULT 0,
 "bathrooms" REAL DEFAULT 0,
 "bedrooms" REAL DEFAULT 0,
 "captado_por" TEXT,
 "city" TEXT,
 "code" TEXT,
 "company_id" TEXT NOT NULL,
 "condo_fee" REAL DEFAULT 0 CHECK("condo_fee" IS NULL OR "condo_fee">=0),
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "description" TEXT,
 "features" TEXT DEFAULT '[]',
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "iptu" REAL DEFAULT 0 CHECK("iptu" IS NULL OR "iptu">=0),
 "listed_at" TEXT,
 "neighborhood" TEXT,
 "owner_email" TEXT,
 "owner_name" TEXT,
 "owner_phone" TEXT,
 "parking" REAL DEFAULT 0,
 "photos" TEXT DEFAULT '[]',
 "price" REAL NOT NULL CHECK("price" IS NULL OR "price">=0),
 "slug" TEXT,
 "state" TEXT,
 "status" TEXT NOT NULL DEFAULT 'disponivel',
 "suites" REAL DEFAULT 0,
 "title" TEXT NOT NULL,
 "transaction" TEXT NOT NULL,
 "type" TEXT NOT NULL,
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "video_url" TEXT,
 "zip_code" TEXT
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_property_company_id ON property(company_id);" }, { "sql": `CREATE TABLE IF NOT EXISTS "proposal" (
 "company_id" TEXT NOT NULL,
 "contract_url" TEXT,
 "corretor_id" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "lead_id" TEXT NOT NULL,
 "lead_name" TEXT,
 "observations" TEXT,
 "payment_terms" TEXT,
 "property_id" TEXT NOT NULL,
 "property_title" TEXT,
 "status" TEXT NOT NULL DEFAULT 'em_analise',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "value" REAL NOT NULL CHECK("value" IS NULL OR "value">=0)
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_proposal_company_id ON proposal(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_proposal_lead_id ON proposal(lead_id);" }, { "sql": `CREATE TABLE IF NOT EXISTS "revenue" (
 "amount" REAL NOT NULL CHECK("amount" IS NULL OR "amount">=0),
 "category" TEXT,
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "date" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "notes" TEXT,
 "payment_status" TEXT NOT NULL DEFAULT 'pendente',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_revenue_company_id ON revenue(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);" }, { "sql": `CREATE TABLE IF NOT EXISTS "user_roles" (
 "company_id" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "role" TEXT NOT NULL,
 "user_id" TEXT NOT NULL
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);" }, { "sql": `CREATE TABLE IF NOT EXISTS "visit" (
 "company_id" TEXT NOT NULL,
 "corretor_id" TEXT,
 "corretor_nome" TEXT,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "feedback" TEXT,
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "lead_id" TEXT,
 "lead_name" TEXT,
 "lead_phone" TEXT,
 "notes" TEXT,
 "property_id" TEXT NOT NULL,
 "property_title" TEXT,
 "scheduled_at" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'agendada',
 "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_visit_company_id ON visit(company_id);" }, { "sql": "CREATE INDEX IF NOT EXISTS idx_visit_lead_id ON visit(lead_id);" }, { "sql": `CREATE TABLE IF NOT EXISTS "zone" (
 "city" TEXT,
 "company_id" TEXT NOT NULL,
 "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
 "name" TEXT NOT NULL,
 "state" TEXT
);` }, { "sql": "CREATE INDEX IF NOT EXISTS idx_zone_company_id ON zone(company_id);" }, { "sql": "CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY,email TEXT);" }, { "sql": "CREATE TABLE IF NOT EXISTS template_owner(id TEXT PRIMARY KEY,user_id TEXT NOT NULL);" }, { "sql": "CREATE UNIQUE INDEX IF NOT EXISTS company_member_email ON company_user(company_id,lower(email));" }, { "sql": "CREATE UNIQUE INDEX IF NOT EXISTS user_role_unique ON user_roles(user_id,role);" }, { "sql": "CREATE UNIQUE INDEX IF NOT EXISTS visit_property_slot ON visit(property_id,scheduled_at) WHERE status<>'cancelada';" }, { "sql": "CREATE UNIQUE INDEX IF NOT EXISTS commission_proposal_unique ON commission(proposal_id,corretor_id) WHERE proposal_id IS NOT NULL;" }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_company_id_insert BEFORE INSERT ON "commission" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_company_id_update BEFORE UPDATE ON "commission" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_corretor_id_insert BEFORE INSERT ON "commission" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_corretor_id_update BEFORE UPDATE ON "commission" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_property_id_insert BEFORE INSERT ON "commission" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_property_id_update BEFORE UPDATE ON "commission" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_proposal_id_insert BEFORE INSERT ON "commission" WHEN NEW."proposal_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "proposal" WHERE id=NEW."proposal_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_commission_proposal_id_update BEFORE UPDATE ON "commission" WHEN NEW."proposal_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "proposal" WHERE id=NEW."proposal_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_company_user_company_id_insert BEFORE INSERT ON "company_user" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_company_user_company_id_update BEFORE UPDATE ON "company_user" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_lead_company_id_insert BEFORE INSERT ON "lead" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_lead_company_id_update BEFORE UPDATE ON "lead" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_lead_assigned_to_insert BEFORE INSERT ON "lead" WHEN NEW."assigned_to" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."assigned_to" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_lead_assigned_to_update BEFORE UPDATE ON "lead" WHEN NEW."assigned_to" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."assigned_to" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_lead_interest_property_id_insert BEFORE INSERT ON "lead" WHEN NEW."interest_property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."interest_property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_lead_interest_property_id_update BEFORE UPDATE ON "lead" WHEN NEW."interest_property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."interest_property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_operational_cost_company_id_insert BEFORE INSERT ON "operational_cost" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_operational_cost_company_id_update BEFORE UPDATE ON "operational_cost" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_property_company_id_insert BEFORE INSERT ON "property" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_property_company_id_update BEFORE UPDATE ON "property" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_property_captado_por_insert BEFORE INSERT ON "property" WHEN NEW."captado_por" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."captado_por" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_property_captado_por_update BEFORE UPDATE ON "property" WHEN NEW."captado_por" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."captado_por" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_company_id_insert BEFORE INSERT ON "proposal" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_company_id_update BEFORE UPDATE ON "proposal" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_lead_id_insert BEFORE INSERT ON "proposal" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_lead_id_update BEFORE UPDATE ON "proposal" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_property_id_insert BEFORE INSERT ON "proposal" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_property_id_update BEFORE UPDATE ON "proposal" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_corretor_id_insert BEFORE INSERT ON "proposal" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_proposal_corretor_id_update BEFORE UPDATE ON "proposal" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_revenue_company_id_insert BEFORE INSERT ON "revenue" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_revenue_company_id_update BEFORE UPDATE ON "revenue" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_company_id_insert BEFORE INSERT ON "visit" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_company_id_update BEFORE UPDATE ON "visit" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_property_id_insert BEFORE INSERT ON "visit" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_property_id_update BEFORE UPDATE ON "visit" WHEN NEW."property_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "property" WHERE id=NEW."property_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_lead_id_insert BEFORE INSERT ON "visit" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_lead_id_update BEFORE UPDATE ON "visit" WHEN NEW."lead_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "lead" WHERE id=NEW."lead_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_corretor_id_insert BEFORE INSERT ON "visit" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_visit_corretor_id_update BEFORE UPDATE ON "visit" WHEN NEW."corretor_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company_user" WHERE id=NEW."corretor_id" AND company_id=NEW.company_id) BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_zone_company_id_insert BEFORE INSERT ON "zone" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": `CREATE TRIGGER IF NOT EXISTS ref_zone_company_id_update BEFORE UPDATE ON "zone" WHEN NEW."company_id" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "company" WHERE id=NEW."company_id") BEGIN SELECT RAISE(ABORT,'Refer\xEAncia pertence a outra imobili\xE1ria ou n\xE3o existe'); END;` }, { "sql": "CREATE TRIGGER IF NOT EXISTS imobflow_schema_v1 AFTER INSERT ON app_config BEGIN SELECT 1; END;" }, { "sql": "INSERT OR IGNORE INTO app_config(id,app_name,super_admin_emails,system_settings) VALUES('default','ImobFlow AI','[]','{}');" }];
var ready = /* @__PURE__ */ new Map();
async function ensureDatabase(sql, projectId) {
  if (!ready.has(projectId)) ready.set(projectId, (async () => {
    const check = await sql.sql("SELECT name FROM sqlite_master WHERE type='trigger' AND name='imobflow_schema_v1'");
    if (!check.rows.length) await sql.batch(statements, "write");
  })().catch((e) => {
    ready.delete(projectId);
    throw e;
  }));
  await ready.get(projectId);
}

// server/native/sql-adapter.ts
var rowsToColumns = (rows = []) => rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => "_" + letter.toLowerCase()), value])));
function adaptBlinkSql(client) {
  return {
    async sql(query, args) {
      const result = await client.sql(query, args);
      return { ...result, rows: rowsToColumns(result.rows) };
    },
    async batch(statements2, mode) {
      const result = await client.batch(statements2, mode);
      return { ...result, results: (result.results || []).map((item) => ({ ...item, rows: rowsToColumns(item.rows) })) };
    }
  };
}

// server/native/owner.ts
async function ownerEligible(auth, env, sql) {
  if (!auth.userId || !env.BLINK_PROJECT_ID || env.OWNER_PROJECT_ID !== env.BLINK_PROJECT_ID) return false;
  if (env.OWNER_USER_ID && auth.userId === env.OWNER_USER_ID) return true;
  const ownerEmail = env.OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail || auth.email?.trim().toLowerCase() !== ownerEmail) return false;
  const row = (await sql.sql("SELECT email,email_verified FROM users WHERE id=? LIMIT 1", [auth.userId])).rows[0];
  return !!row && Number(row.email_verified) === 1 && String(row.email).trim().toLowerCase() === ownerEmail;
}

// shared/query.ts
var Query = class {
  constructor(table, execute) {
    this.execute = execute;
    this.spec = { table, action: "select", columns: "*", filters: [], orders: [] };
  }
  spec;
  select(columns = "*", options = {}) {
    this.spec.columns = columns;
    this.spec.head = !!options.head;
    return this;
  }
  filter(key, op, value) {
    this.spec.filters.push({ key, op, value });
    return this;
  }
  eq(k, v) {
    return this.filter(k, "eq", v);
  }
  neq(k, v) {
    return this.filter(k, "neq", v);
  }
  is(k, v) {
    return this.filter(k, "is", v);
  }
  gt(k, v) {
    return this.filter(k, "gt", v);
  }
  gte(k, v) {
    return this.filter(k, "gte", v);
  }
  lt(k, v) {
    return this.filter(k, "lt", v);
  }
  lte(k, v) {
    return this.filter(k, "lte", v);
  }
  ilike(k, v) {
    return this.filter(k, "ilike", v);
  }
  in(k, v) {
    return this.filter(k, "in", v);
  }
  not(k, op, v) {
    if (op !== "is" || v !== null) throw new Error("Filtro n\xE3o suportado");
    return this.filter(k, "notnull", null);
  }
  order(key, opts = {}) {
    this.spec.orders.push({ key, ascending: opts.ascending !== false });
    return this;
  }
  limit(n) {
    this.spec.limit = n;
    return this;
  }
  range(a, b) {
    this.spec.offset = a;
    this.spec.limit = b - a + 1;
    return this;
  }
  insert(v) {
    this.spec.action = "insert";
    this.spec.payload = v;
    return this;
  }
  upsert(v, opts = {}) {
    this.spec.action = "upsert";
    this.spec.payload = v;
    this.spec.conflict = opts.onConflict;
    return this;
  }
  update(v) {
    this.spec.action = "update";
    this.spec.payload = v;
    return this;
  }
  delete() {
    this.spec.action = "delete";
    return this;
  }
  single() {
    this.spec.cardinality = "one";
    return this;
  }
  maybeSingle() {
    this.spec.cardinality = "maybe";
    return this;
  }
  then(ok, fail) {
    return this.execute(this.spec).then(ok, fail);
  }
};

// server/native/schema.ts
var schema = { "app_config": { "app_name": "TEXT", "created_at": "TEXT", "id": "TEXT", "super_admin_emails": "TEXT", "system_settings": "TEXT", "updated_at": "TEXT" }, "commission": { "company_id": "TEXT", "corretor_id": "TEXT", "corretor_nome": "TEXT", "created_at": "TEXT", "date": "TEXT", "id": "TEXT", "notes": "TEXT", "payment_status": "TEXT", "percentage": "REAL", "property_id": "TEXT", "proposal_id": "TEXT", "updated_at": "TEXT", "value": "REAL" }, "company": { "cnpj": "TEXT", "cor_primaria": "TEXT", "created_at": "TEXT", "creci": "TEXT", "email": "TEXT", "endereco": "TEXT", "id": "TEXT", "logo_url": "TEXT", "name": "TEXT", "owner_email": "TEXT", "owner_nome": "TEXT", "owner_telefone": "TEXT", "plano": "TEXT", "settings": "TEXT", "slug": "TEXT", "status": "TEXT", "telefone": "TEXT", "trial_ate": "TEXT", "updated_at": "TEXT" }, "company_user": { "ativo": "BOOLEAN", "comissao_pct": "REAL", "company_id": "TEXT", "created_at": "TEXT", "creci": "TEXT", "email": "TEXT", "id": "TEXT", "must_change_password": "BOOLEAN", "nome": "TEXT", "role": "TEXT", "ultimo_login": "TEXT", "updated_at": "TEXT", "user_id": "TEXT" }, "lead": { "assigned_to": "TEXT", "bedrooms_min": "REAL", "budget_max": "REAL", "company_id": "TEXT", "created_at": "TEXT", "email": "TEXT", "id": "TEXT", "interest_property_id": "TEXT", "interest_type": "TEXT", "lost_reason": "TEXT", "name": "TEXT", "neighborhoods": "TEXT", "notes": "TEXT", "phone": "TEXT", "source": "TEXT", "status": "TEXT", "updated_at": "TEXT" }, "operational_cost": { "amount": "REAL", "category": "TEXT", "company_id": "TEXT", "created_at": "TEXT", "date": "TEXT", "description": "TEXT", "id": "TEXT", "payment_status": "TEXT", "recurring": "BOOLEAN", "updated_at": "TEXT" }, "property": { "address": "TEXT", "area_total": "REAL", "area_useful": "REAL", "bathrooms": "REAL", "bedrooms": "REAL", "captado_por": "TEXT", "city": "TEXT", "code": "TEXT", "company_id": "TEXT", "condo_fee": "REAL", "created_at": "TEXT", "description": "TEXT", "features": "TEXT", "id": "TEXT", "iptu": "REAL", "listed_at": "TEXT", "neighborhood": "TEXT", "owner_email": "TEXT", "owner_name": "TEXT", "owner_phone": "TEXT", "parking": "REAL", "photos": "TEXT", "price": "REAL", "slug": "TEXT", "state": "TEXT", "status": "TEXT", "suites": "REAL", "title": "TEXT", "transaction": "TEXT", "type": "TEXT", "updated_at": "TEXT", "video_url": "TEXT", "zip_code": "TEXT" }, "proposal": { "company_id": "TEXT", "contract_url": "TEXT", "corretor_id": "TEXT", "created_at": "TEXT", "id": "TEXT", "lead_id": "TEXT", "lead_name": "TEXT", "observations": "TEXT", "payment_terms": "TEXT", "property_id": "TEXT", "property_title": "TEXT", "status": "TEXT", "updated_at": "TEXT", "value": "REAL" }, "revenue": { "amount": "REAL", "category": "TEXT", "company_id": "TEXT", "created_at": "TEXT", "date": "TEXT", "description": "TEXT", "id": "TEXT", "notes": "TEXT", "payment_status": "TEXT", "updated_at": "TEXT" }, "user_roles": { "company_id": "TEXT", "created_at": "TEXT", "id": "TEXT", "role": "TEXT", "user_id": "TEXT" }, "visit": { "company_id": "TEXT", "corretor_id": "TEXT", "corretor_nome": "TEXT", "created_at": "TEXT", "feedback": "TEXT", "id": "TEXT", "lead_id": "TEXT", "lead_name": "TEXT", "lead_phone": "TEXT", "notes": "TEXT", "property_id": "TEXT", "property_title": "TEXT", "scheduled_at": "TEXT", "status": "TEXT", "updated_at": "TEXT" }, "zone": { "city": "TEXT", "company_id": "TEXT", "created_at": "TEXT", "id": "TEXT", "name": "TEXT", "state": "TEXT" }, "profiles": { "user_id": "TEXT", "email": "TEXT" }, "template_owner": { "id": "TEXT", "user_id": "TEXT" } };
var jsonFields = /* @__PURE__ */ new Set(["address", "endereco", "features", "neighborhoods", "photos", "settings", "super_admin_emails", "system_settings"]);

// server/native/database.ts
var q = (s) => '"' + s + '"';
var val = (v) => typeof v === "boolean" ? Number(v) : v !== null && typeof v === "object" ? JSON.stringify(v) : v ?? null;
var roles = ["owner", "admin", "corretor", "captador", "financeiro"];
var writeRoles = { company: ["owner", "admin"], company_user: ["owner"], property: ["owner", "admin", "corretor", "captador"], lead: ["owner", "admin", "corretor"], visit: ["owner", "admin", "corretor"], proposal: ["owner", "admin", "corretor"], commission: ["owner", "admin", "financeiro"], revenue: ["owner", "admin", "financeiro"], operational_cost: ["owner", "admin", "financeiro"], zone: ["owner", "admin"] };
function decode(table, row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => {
    if (schema[table]?.[k] === "BOOLEAN") return [k, v === true || v === 1 || v === "1"];
    if (schema[table]?.[k] === "REAL" && v !== null) return [k, Number(v)];
    if (jsonFields.has(k) && typeof v === "string") {
      try {
        return [k, JSON.parse(v)];
      } catch {
      }
    }
    return [k, v];
  }));
}
var Database = class {
  constructor(sql, identity) {
    this.sql = sql;
    this.identity = identity;
  }
  from(table) {
    return new Query(table, (s) => this.execute(s));
  }
  async scope(table, write) {
    const u = this.identity;
    if (!schema[table] || ["profiles", "user_roles", "template_owner"].includes(table)) throw Error("Tabela indispon\xEDvel");
    if (!u.userId) throw Error("Autentica\xE7\xE3o necess\xE1ria");
    if (table === "app_config") {
      if (!u.master) throw Error("Acesso restrito");
      return { clause: "1=1", args: [] };
    }
    if (u.master && !u.companyId) {
      if (table === "company") return { clause: "1=1", args: [] };
      throw Error("Selecione uma imobili\xE1ria no painel Master");
    }
    if (u.master && u.companyId) return { clause: (table === "company" ? "id" : "company_id") + "=?", args: [u.companyId] };
    if (!u.companyId) {
      if (table === "company_user" && !write) return { clause: "user_id=?", args: [u.userId] };
      throw Error("Cl\xEDnica n\xE3o encontrada");
    }
    const c = (await this.sql.sql("SELECT status,trial_ate FROM company WHERE id=?", [u.companyId])).rows[0];
    if (table !== "company" && table !== "company_user" && (!c || ["blocked", "canceled"].includes(c.status) || c.status === "trial" && c.trial_ate && c.trial_ate < (/* @__PURE__ */ new Date()).toISOString().slice(0, 10))) throw Error("Acesso \xE0 imobili\xE1ria suspenso; contate o administrador");
    if (["commission", "revenue", "operational_cost"].includes(table) && !["owner", "admin", "financeiro"].includes(u.role || "")) throw Error("Acesso financeiro restrito");
    if (write && !writeRoles[table]?.includes(u.role || "")) throw Error("Permiss\xE3o insuficiente");
    return { clause: (table === "company" ? "id" : "company_id") + "=?", args: [u.companyId] };
  }
  async execute(input) {
    try {
      const s = structuredClone(input), t = s.table, write = s.action !== "select";
      if (!["select", "insert", "update", "delete"].includes(s.action)) throw Error("Opera\xE7\xE3o inv\xE1lida");
      const col = (k) => {
        if (!schema[t]?.[k]) throw Error("Coluna inv\xE1lida: " + k);
        return q(k);
      };
      const scope = await this.scope(t, write), args = [...scope.args], where = [scope.clause];
      if (!Array.isArray(s.filters) || s.filters.length > 30) throw Error("Filtros inv\xE1lidos");
      for (const f of s.filters) {
        const k = col(f.key);
        if (f.op === "in") {
          if (!Array.isArray(f.value) || f.value.length > 1e3) throw Error("Filtro inv\xE1lido");
          where.push(f.value.length ? k + " IN (" + f.value.map(() => "?").join(",") + ")" : "0=1");
          args.push(...f.value.map(val));
          continue;
        }
        if (f.op === "notnull") {
          where.push(k + " IS NOT NULL");
          continue;
        }
        const op = { eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=", is: "IS", ilike: "LIKE" };
        if (!op[f.op]) throw Error("Operador inv\xE1lido");
        where.push(k + " " + op[f.op] + " ?");
        args.push(val(f.value));
      }
      const clause = where.join(" AND ");
      const limit = Math.min(5e3, Math.max(0, Number(s.limit ?? 1e3))), offset = Math.max(0, Number(s.offset ?? 0));
      if (!Number.isInteger(limit) || !Number.isInteger(offset)) throw Error("Pagina\xE7\xE3o inv\xE1lida");
      const selected = s.columns === "*" || !s.columns ? null : s.columns.split(",").map((x) => x.trim());
      selected?.forEach(col);
      let rows = [], count = 0;
      if (!write) {
        count = Number((await this.sql.sql("SELECT COUNT(*) AS total FROM " + q(t) + " WHERE " + clause, args)).rows[0]?.total || 0);
        if (!s.head) rows = (await this.sql.sql("SELECT * FROM " + q(t) + " WHERE " + clause + (s.orders?.length ? " ORDER BY " + s.orders.map((o) => col(o.key) + (o.ascending ? " ASC" : " DESC")).join(",") : "") + " LIMIT ? OFFSET ?", [...args, limit, offset])).rows;
      } else {
        if (s.action !== "insert" && !s.filters.length) throw Error("Altera\xE7\xE3o exige filtro expl\xEDcito");
        if (t === "app_config" && s.action !== "update") throw Error("Configura\xE7\xE3o protegida");
        if (t === "company" && s.action === "insert") throw Error("Use o cadastro de cl\xEDnica");
        if (s.action === "delete") {
          if (t === "company_user" && (await this.sql.sql("SELECT 1 FROM company_user WHERE " + clause + " AND role='owner'", args)).rows.length) throw Error("N\xE3o \xE9 permitido excluir o propriet\xE1rio");
          rows = (await this.sql.sql("DELETE FROM " + q(t) + " WHERE " + clause + " RETURNING *", args)).rows;
        } else {
          const payloads = Array.isArray(s.payload) ? s.payload : [s.payload];
          if (payloads.length !== 1) throw Error("Salve um registro por vez");
          const raw2 = payloads[0];
          if (!raw2 || typeof raw2 !== "object") throw Error("Dados inv\xE1lidos");
          const row = { ...raw2 };
          Object.keys(row).forEach(col);
          if (s.action === "update") {
            delete row.id;
            delete row.created_at;
            delete row.company_id;
            if (schema[t].updated_at) row.updated_at = (/* @__PURE__ */ new Date()).toISOString();
          }
          if (t !== "company" && t !== "app_config" && s.action === "insert") {
            if (row.company_id && row.company_id !== this.identity.companyId) throw Error("Imobili\xE1ria inv\xE1lida");
            row.company_id = this.identity.companyId;
          }
          if (!this.identity.master) {
            if (t === "company" && Object.keys(row).some((k) => !["name", "slug", "cnpj", "creci", "telefone", "email", "endereco", "cor_primaria", "logo_url", "settings", "updated_at"].includes(k))) throw Error("Campo da cl\xEDnica protegido");
            if (t !== "company" && s.action === "insert") {
              if (row.company_id && row.company_id !== this.identity.companyId) throw Error("Cl\xEDnica inv\xE1lida");
              row.company_id = this.identity.companyId;
            }
          }
          if (t === "app_config" && "super_admin_emails" in row) throw Error("O administrador \xE9 definido no backend desta c\xF3pia");
          if (t === "company_user") {
            if ("user_id" in row || "must_change_password" in row) throw Error("Acesso deve ser confirmado pelo titular do email");
            if (row.role && (!roles.includes(row.role) || row.role === "owner")) throw Error("Perfil inv\xE1lido");
            if (s.action === "update" && (await this.sql.sql("SELECT 1 FROM company_user WHERE " + clause + " AND role='owner'", args)).rows.length) throw Error("Cadastro do propriet\xE1rio protegido");
            if (row.email) {
              row.email = String(row.email).trim().toLowerCase();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) throw Error("Email inv\xE1lido");
              if (s.action === "update") row.user_id = null;
            }
          }
          for (const k of ["value", "price", "amount", "budget_max", "percentage", "comissao_pct", "area_total", "area_useful", "bedrooms", "bathrooms", "parking", "iptu", "condo_fee"]) if (row[k] != null && (!Number.isFinite(Number(row[k])) || Number(row[k]) < 0)) throw Error("Valor inv\xE1lido: " + k);
          if (row.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) throw Error("Endere\xE7o da vitrine inv\xE1lido");
          if (row.cor_primaria && !/^#[0-9a-f]{6}$/i.test(row.cor_primaria)) throw Error("Cor inv\xE1lida");
          if (t === "visit" && row.scheduled_at) {
            const d = new Date(row.scheduled_at);
            if (!Number.isFinite(d.getTime())) throw Error("Data inv\xE1lida");
            row.scheduled_at = d.toISOString();
          }
          const statuses = { company: ["active", "trial", "blocked", "canceled"], property: ["disponivel", "reservado", "vendido", "alugado", "inativo"], lead: ["novo", "em_atendimento", "qualificado", "visita_marcada", "proposta", "negociacao", "fechado", "perdido"], proposal: ["em_analise", "aceita", "recusada", "contra_proposta", "expirada"], visit: ["agendada", "confirmada", "realizada", "cancelada", "no_show", "nao_compareceu"] };
          if (row.status && statuses[t] && !statuses[t].includes(row.status)) throw Error("Status inv\xE1lido");
          if (row.payment_status && !["pendente", "pago", "atrasado", "cancelado"].includes(row.payment_status)) throw Error("Status de pagamento inv\xE1lido");
          for (const k of ["photos", "features", "neighborhoods"]) if (k in row && (!Array.isArray(row[k]) || row[k].length > 100)) throw Error("Lista inv\xE1lida");
          if (t === "company_user" && row.comissao_pct != null && Number(row.comissao_pct) > 100) throw Error("Percentual inv\xE1lido");
          if (t === "commission" && row.percentage != null && Number(row.percentage) > 100) throw Error("Percentual inv\xE1lido");
          if (t === "proposal" && s.action === "update" && (await this.sql.sql("SELECT 1 FROM proposal WHERE " + clause + " AND status='aceita'", args)).rows.length && Object.keys(row).some((k) => !["status", "updated_at", "observations", "contract_url"].includes(k))) throw Error("Crie uma nova proposta para mudar valores de uma proposta aceita");
          if (s.action === "insert" && !row.id) row.id = crypto.randomUUID();
          const keys = Object.keys(row);
          const params = keys.map((k) => val(row[k]));
          const statement = s.action === "update" ? "UPDATE " + q(t) + " SET " + keys.map((k) => col(k) + "=?").join(",") + " WHERE " + clause + " RETURNING *" : "INSERT INTO " + q(t) + " (" + keys.map(col).join(",") + ") VALUES (" + keys.map(() => "?").join(",") + ") RETURNING *";
          rows = (await this.sql.sql(statement, s.action === "update" ? [...params, ...args] : params)).rows;
        }
        count = rows.length;
      }
      const data = rows.map((row) => {
        const d = decode(t, row);
        return selected ? Object.fromEntries(selected.map((k) => [k, d[k]])) : d;
      });
      if (s.cardinality === "one" && data.length !== 1) throw Error("Registro n\xE3o encontrado");
      if (s.cardinality === "maybe" && data.length > 1) throw Error("Mais de um registro encontrado");
      return { data: s.head ? null : s.cardinality ? data[0] ?? null : data, error: null, count };
    } catch (e) {
      return { data: null, error: { message: e.message }, count: 0 };
    }
  }
};

// server/native/context.ts
async function makeContext(request, env, anonymous = false) {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY, auth: { mode: "headless" } }), sql = adaptBlinkSql(blink.db);
  await ensureDatabase(sql, env.BLINK_PROJECT_ID);
  const h = anonymous ? null : request.headers.get("authorization");
  const auth = h ? await blink.auth.verifyToken(h) : { valid: false };
  if (h && (!auth.valid || !auth.userId || auth.projectId !== env.BLINK_PROJECT_ID)) throw Error("Sess\xE3o inv\xE1lida");
  const userId = auth.valid ? auth.userId : "", email = auth.valid ? String(auth.email || "").trim().toLowerCase() : "";
  if (userId) {
    await sql.sql("INSERT INTO profiles(user_id,email) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email", [userId, email]);
    if (await ownerEligible({ userId, email }, env, sql)) await sql.batch([{ sql: "INSERT INTO template_owner(id,user_id) VALUES('owner',?) ON CONFLICT(id) DO NOTHING", args: [userId] }, { sql: "INSERT INTO user_roles(id,user_id,role) SELECT ?,?,'super_admin' WHERE EXISTS(SELECT 1 FROM template_owner WHERE id='owner' AND user_id=?) ON CONFLICT(user_id,role) DO NOTHING", args: ["owner:" + userId, userId, userId] }], "write");
    const v = (await sql.sql("SELECT email,email_verified FROM users WHERE id=?", [userId])).rows[0];
    if (Number(v?.email_verified) === 1 && String(v.email).toLowerCase() === email) await sql.sql("UPDATE company_user SET user_id=? WHERE lower(email)=? AND user_id IS NULL", [userId, email]);
  }
  const master = !!userId && !!(await sql.sql("SELECT 1 FROM user_roles WHERE user_id=? AND role='super_admin'", [userId])).rows.length;
  const selected = master ? request.headers.get("x-company-id") : null;
  const member = selected ? (await sql.sql("SELECT id AS company_id FROM company WHERE id=?", [selected])).rows[0] : userId ? (await sql.sql("SELECT company_id,role FROM company_user WHERE user_id=? AND ativo=1 ORDER BY created_at LIMIT 1", [userId])).rows[0] : null;
  const identity = { userId, email, master, companyId: member?.company_id, role: master ? "owner" : member?.role };
  return { blink, sql, identity, db: new Database(sql, identity), env };
}

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val2) => Number.isInteger(val2) : (val2) => typeof val2 === "number" && Number.isFinite(val2) && Math.floor(val2) === val2;
  function joinValues(array, separator = " | ") {
    return array.map((val2) => typeof val2 === "string" ? `'${val2}'` : val2).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val2) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val2);
      } else {
        return message;
      }
    };
    return this._refinement((val2, ctx) => {
      const result = check(val2);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val2)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val2, ctx) => {
      if (!check(val2)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val2, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val2, step) {
  const valDecCount = (val2.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val2.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema2, params) => {
  return new ZodArray({
    type: schema2,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema2) {
  if (schema2 instanceof ZodObject) {
    const newShape = {};
    for (const key in schema2.shape) {
      const fieldSchema = schema2.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema2._def,
      shape: () => newShape
    });
  } else if (schema2 instanceof ZodArray) {
    return new ZodArray({
      ...schema2._def,
      type: deepPartialify(schema2.element)
    });
  } else if (schema2 instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema2.unwrap()));
  } else if (schema2 instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema2.unwrap()));
  } else if (schema2 instanceof ZodTuple) {
    return ZodTuple.create(schema2.items.map((item) => deepPartialify(item)));
  } else {
    return schema2;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema2) {
    return this.augment({ [key]: schema2 });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema2 = this._def.items[itemIndex] || this._def.rest;
      if (!schema2)
        return null;
      return schema2._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val2 of this._def.values) {
      enumValues[val2] = val2;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val2 of this._def.values) {
      enumValues[val2] = val2;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val2 of this._def.values) {
      enumValues[val2] = val2;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema2, params) => {
  return new ZodPromise({
    type: schema2,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema2, effect, params) => {
  return new ZodEffects({
    schema: schema2,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema2, params) => {
  return new ZodEffects({
    schema: schema2,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// server/native/public.ts
var fields = ["id", "company_id", "title", "description", "price", "type", "transaction", "status", "area_total", "area_useful", "bedrooms", "suites", "bathrooms", "parking", "condo_fee", "iptu", "city", "neighborhood", "state", "photos", "features", "video_url", "slug", "code", "listed_at"];
var contact = external_exports.object({ name: external_exports.string().trim().min(2).max(120), phone: external_exports.string().trim().min(8).max(24), email: external_exports.string().trim().email().max(200).optional().or(external_exports.literal("")), message: external_exports.string().max(1e3).optional() });
var pick = (row, keys) => Object.fromEntries(keys.map((k) => [k, row[k]]));
async function load(ctx, slug, id) {
  if (typeof slug !== "string" || slug.length > 100) throw Error("Vitrine inv\xE1lida");
  const raw2 = (await ctx.sql.sql("SELECT * FROM company WHERE slug=? AND status IN ('active','trial') AND (status<>'trial' OR trial_ate IS NULL OR trial_ate>=?)", [slug, (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)])).rows[0];
  if (!raw2) throw Error("Imobili\xE1ria n\xE3o encontrada");
  const c = decode("company", raw2);
  if (c.settings?.public_showcase?.enabled === false) throw Error("Vitrine indispon\xEDvel");
  const company = { ...pick(c, ["id", "name", "slug", "logo_url", "telefone", "email", "creci", "cor_primaria"]), settings: pick(c.settings || {}, ["vitrine_descricao", "whatsapp", "depoimentos"]) };
  const all = (await ctx.sql.sql("SELECT * FROM property WHERE company_id=? AND status='disponivel' ORDER BY created_at DESC LIMIT 500", [c.id])).rows.map((r) => pick(decode("property", r), fields));
  const property = id ? all.find((p) => p.id === id) : null;
  if (id && !property) throw Error("Im\xF3vel n\xE3o encontrado");
  return { company, properties: all, property, similar: all.filter((p) => p.id !== id).slice(0, 3) };
}
async function publicApi(ctx, input) {
  const { action, slug, id } = input || {}, data = await load(ctx, slug, id);
  if (action === "catalog") return data;
  if (!data.property) throw Error("Im\xF3vel obrigat\xF3rio");
  if (action === "slots") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw Error("Data inv\xE1lida");
    const rows = (await ctx.sql.sql("SELECT scheduled_at FROM visit WHERE property_id=? AND status<>'cancelada' AND scheduled_at>=? AND scheduled_at<?", [id, input.date + "T00:00:00.000Z", input.date + "T23:59:59.999Z"])).rows;
    return { taken: rows.map((r) => r.scheduled_at) };
  }
  if (!["interest", "book"].includes(action)) throw Error("A\xE7\xE3o inv\xE1lida");
  const v = contact.parse(input);
  const recent = (await ctx.sql.sql("SELECT COUNT(*) AS n FROM lead WHERE company_id=? AND phone=? AND created_at>=?", [data.company.id, v.phone, new Date(Date.now() - 36e5).toISOString()])).rows[0];
  if (Number(recent?.n) > 5) throw Error("Solicita\xE7\xF5es demais; fale diretamente com a imobili\xE1ria");
  const leadId = crypto.randomUUID();
  const batch = [{ sql: "INSERT INTO lead(id,company_id,name,phone,email,source,status,interest_property_id,notes) VALUES(?,?,?,?,?,?,?,?,?)", args: [leadId, data.company.id, v.name, v.phone, v.email || null, "site", action === "book" ? "visita_marcada" : "novo", id, v.message || null] }];
  if (action === "book") {
    const when = new Date(input.scheduled_at), now = Date.now();
    if (!Number.isFinite(when.getTime()) || when.getTime() < now || when.getTime() > now + 180 * 864e5 || when.getUTCMinutes() !== 0 || when.getUTCSeconds() !== 0) throw Error("Hor\xE1rio inv\xE1lido");
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hourCycle: "h23" }).format(when));
    if (![9, 10, 11, 14, 15, 16, 17, 18].includes(hour)) throw Error("Escolha um hor\xE1rio de atendimento");
    const visitId = crypto.randomUUID();
    batch.push({ sql: "INSERT INTO visit(id,company_id,property_id,property_title,lead_id,lead_name,lead_phone,scheduled_at,status) VALUES(?,?,?,?,?,?,?,?,'agendada')", args: [visitId, data.company.id, id, data.property.title, leadId, v.name, v.phone, when.toISOString()] });
    try {
      await ctx.sql.batch(batch, "write");
    } catch (e) {
      if (/unique|constraint/i.test(e.message)) throw Error("Este hor\xE1rio j\xE1 foi reservado; escolha outro");
      throw e;
    }
    return { ok: true, protocolo: "VIS-" + visitId.slice(0, 8).toUpperCase() };
  }
  await ctx.sql.batch(batch, "write");
  return { ok: true };
}

// server/native/company.ts
var form = external_exports.object({ name: external_exports.string().trim().min(2).max(120), ownerEmail: external_exports.string().email().max(200).optional(), ownerNome: external_exports.string().max(120).optional(), slug: external_exports.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(), cnpj: external_exports.string().max(30).optional(), creci: external_exports.string().max(40).optional(), telefone: external_exports.string().max(30).optional(), whatsapp: external_exports.string().max(30).optional(), email: external_exports.string().max(200).optional(), cor: external_exports.string().regex(/^#[0-9a-f]{6}$/i).optional(), plano: external_exports.enum(["starter", "pro", "enterprise"]).default("starter") });
async function createCompany(ctx, input, master = false) {
  const { identity: u, sql } = ctx;
  if (!u.userId) throw Error("Autentica\xE7\xE3o necess\xE1ria");
  if (master && !u.master) throw Error("Acesso restrito");
  if (!master && (await sql.sql("SELECT id FROM company_user WHERE user_id=?", [u.userId])).rows.length) throw Error("Voc\xEA j\xE1 possui uma imobili\xE1ria");
  const verified = (await sql.sql("SELECT email,email_verified FROM users WHERE id=?", [u.userId])).rows[0];
  if (!verified || Number(verified.email_verified) !== 1) throw Error("Verifique seu email para continuar");
  const v = form.parse(input), email = (master ? v.ownerEmail : u.email)?.trim().toLowerCase();
  if (!email) throw Error("Informe o email do administrador");
  const id = crypto.randomUUID(), slug = v.slug || v.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + "-" + id.slice(0, 5);
  await sql.batch([{ sql: "INSERT INTO company(id,name,slug,owner_email,owner_nome,cnpj,creci,telefone,email,cor_primaria,plano,trial_ate,settings) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", args: [id, v.name, slug, email, v.ownerNome || email.split("@")[0], v.cnpj || null, v.creci || null, v.whatsapp || v.telefone || null, v.email || null, v.cor || "#2563eb", master ? v.plano : "starter", new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), JSON.stringify({ public_showcase: { enabled: true } })] }, { sql: "INSERT INTO company_user(id,company_id,email,nome,role,user_id) VALUES(?,?,?,?,'owner',?)", args: [crypto.randomUUID(), id, email, v.ownerNome || email.split("@")[0], email === u.email ? u.userId : null] }], "write");
  return { ok: true, id, slug, email };
}

// server/index.ts
var app = new Hono2();
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization", "X-Company-Id"] }));
app.onError((e, c) => {
  console.error("request failed", e.message);
  return c.json({ error: e.message || "Falha ao processar" }, 400);
});
app.get("/health", async (c) => {
  const x = await makeContext(c.req.raw, c.env, true);
  await x.sql.sql("SELECT id FROM app_config LIMIT 1");
  return c.json({ ok: true, database: "connected", version: "imobflow-native-v1" });
});
app.get("/api/bootstrap", async (c) => {
  const x = await makeContext(c.req.raw, c.env), e = c.env;
  const company = x.identity.companyId ? (await x.sql.sql("SELECT * FROM company WHERE id=?", [x.identity.companyId])).rows[0] : null;
  const member = x.identity.companyId ? (await x.sql.sql("SELECT * FROM company_user WHERE company_id=? AND user_id=? AND ativo=1", [x.identity.companyId, x.identity.userId])).rows[0] : null;
  return c.json({ configured: !!(e.OWNER_USER_ID || e.OWNER_EMAIL) && e.OWNER_PROJECT_ID === e.BLINK_PROJECT_ID, isSuperAdmin: x.identity.master, company: company ? decode("company", company) : null, companyUser: member ? decode("company_user", member) : x.identity.master && company ? { id: "master", company_id: company.id, nome: "Administrador", email: x.identity.email, role: "owner", ativo: true } : null });
});
app.post("/api/query", async (c) => {
  const x = await makeContext(c.req.raw, c.env);
  return c.json(await x.db.execute(await c.req.json()));
});
app.post("/api/public", async (c) => {
  const x = await makeContext(c.req.raw, c.env, true);
  return c.json(await publicApi(x, await c.req.json()));
});
app.post("/api/onboarding", async (c) => {
  const x = await makeContext(c.req.raw, c.env);
  return c.json(await createCompany(x, await c.req.json()));
});
app.post("/api/master/company", async (c) => {
  const x = await makeContext(c.req.raw, c.env);
  return c.json(await createCompany(x, await c.req.json(), true));
});
var index_default = app;
export {
  index_default as default
};
