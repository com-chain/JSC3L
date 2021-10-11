
function isScope (obj) {
  return obj && obj.$evalAsync && obj.$watch
}

function isWindow (obj) {
  return obj && obj.window === obj
}

function toJsonReplacer (key, value) {
  let val = value
  if (typeof key === 'string' &&
      key.charAt(0) === '$' &&
      key.charAt(1) === '$') {
    val = undefined
  } else if (isWindow(value)) {
    val = '$WINDOW'
  } else if (value && window.document === value) {
    val = '$DOCUMENT'
  } else if (isScope(value)) {
    val = '$SCOPE'
  }
  return val
}

function isNumber (arg) {
  return typeof arg === 'number'
}

function toJson (obj, pretty?) {
  if (isUndefined(obj)) { return undefined }
  if (!isNumber(pretty)) {
    pretty = pretty ? 2 : null
  }
  return JSON.stringify(obj, toJsonReplacer, pretty)
}

function isDate (value) {
  return toString.call(value) === '[object Date]'
}

function isObject (value) {
  return value !== null && typeof value === 'object'
}

function serializeValue (v) {
  if (isObject(v)) {
    return isDate(v) ? v.toISOString() : toJson(v)
  }
  return v
}

function encodeUriQuery (val, pctEncodeSpaces?) {
  return encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%20/g, pctEncodeSpaces ? '%20' : '+')
}

function isUndefined (value) {
  return typeof value === 'undefined'
}

function forEachSorted (obj, iterator, context?) {
  const keys = Object.keys(obj).sort()
  for (let i = 0; i < keys.length; i++) {
    iterator.call(context, obj[keys[i]], keys[i])
  }
  return keys
}

export function postSerializer (params) {
  if (!params) return ''

  const parts = []
  serialize(params, '', true)
  return parts.join('&')

  function serialize (toSerialize, prefix, topLevel?) {
    if (toSerialize === null || isUndefined(toSerialize)) { return }
    if (Array.isArray(toSerialize)) {
      toSerialize.forEach(function (value, index) {
        serialize(value, prefix + '[' + (isObject(value) ? index : '') + ']')
      })
    } else if (isObject(toSerialize) && !isDate(toSerialize)) {
      forEachSorted(toSerialize, function (value, key) {
        serialize(value,
          prefix + (topLevel ? '' : '[') + key + (topLevel ? '' : ']'))
      })
    } else {
      parts.push(
        encodeUriQuery(prefix) + '=' +
          encodeUriQuery(serializeValue(toSerialize)))
    }
  }
}
