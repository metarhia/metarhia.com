'use strict';

window.global = window;
global.api = {};
global.application = {};

api.common = {};

api.common.falseness = () => false;
api.common.trueness = () => true;
api.common.emptyness = () => {};

// Extend obj with properties of ext
//
api.common.extend = (obj, ext) => {
  if (obj === undefined) obj = null;
  for (const property in ext) obj[property] = ext[property];
  return obj;
};

// Make URL absolute
//
api.common.absoluteUrl = (url) => {
  if (url.charAt(0) === '/') {
    const site = window.location;
    let absoluteUrl = 'ws';
    if (site.protocol === 'https:') absoluteUrl += 's';
    absoluteUrl += '://' + site.host + url;
    return absoluteUrl;
  } else return url;
};

// Return random number less then one argument random(100) or
// between two argumants random(50,150)
//
api.common.random = function(min, max) {
  if (arguments.length === 1) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
};

api.common.bytesToSize = (
  bytes // number to be converted to size Kb, Mb, Gb and Tb
) => {
  if (bytes === 0) return '0';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)), 10);
  return (
    Math.round(bytes / Math.pow(1000, i), 2) +
    api.common.bytesToSize.sizes[i]
  );
};

api.common.bytesToSize.sizes = [
  '', ' Kb', ' Mb', ' Gb', ' Tb', ' Pb', ' Eb', ' Zb', ' Yb'
];

// Simple EventEmitter implementation
//
api.events = {};

// EventEmitter class
//
api.events.EventEmitter = function() {
  api.events.mixinEmitter(this);
};

// EventEmitter mixin
//
api.events.mixinEmitter = function(ee) {

  ee.listeners = {};

  // Add named event handler
  //
  ee.on = function(name, callback) {
    const namedEvent = ee.listeners[name];
    if (!namedEvent) ee.listeners[name] = [callback];
    else namedEvent.push(callback);
  };

  // Emit named event
  //
  ee.emit = function(name, data) {
    const namedEvent = ee.listeners[name];
    if (namedEvent) namedEvent.forEach((callback) => {
      callback(data);
    });
  };

  return ee;

};

// DOM utilities
//
api.dom = {};
api.dom.html = document.documentElement ||
  document.getElementsByTagName('html')[0];
api.dom.head = document.head || document.getElementsByTagName('head')[0];
api.dom.body = null;
api.dom.form = null;

// Platform detection
//
api.dom.platform = {
  iPhone: navigator.userAgent.match(/iPhone/i),
  iPod: navigator.userAgent.match(/iPod/i),
  iPad: navigator.userAgent.match(/iPad/i),
  Android: navigator.userAgent.match(/Android/i),
  IE: navigator.appName.indexOf('Microsoft') !== -1,
  IEMobile: navigator.userAgent.match(/IEMobile/i),
  Chrome: !!window.chrome, // navigator.userAgent.match(/Chrome/i),
  Safari: navigator.userAgent.match(/Safari/i) && !window.chrome,
  FireFox: navigator.userAgent.indexOf('Firefox') > -1,
  BlackBerry: navigator.userAgent.match(/BlackBerry/i),
  WebOS: navigator.userAgent.match(/webOS/i),
  Opera: window.opera, // navigator.userAgent.indexOf('Presto') > -1
  OperaMini: navigator.userAgent.match(/Opera Mini/i),
  OperaMobi: navigator.userAgent.match(/Opera Mobi/i)
};

const platform = api.dom.platform;

platform.iOS = platform.iPhone || platform.iPod || platform.iPad;
platform.Mobile = platform.iOS || platform.Android || platform.OperaMini ||
  platform.OperaMobi || platform.BlackBerry || platform.WebOS;
platform.WebKit = platform.Chrome || platform.Safari;

if (platform.IE) platform.IEVersion = parseFloat(
  navigator.appVersion.split('MSIE')[1]
);

// Patch page links to prevent page reload
//
api.dom.fixLinks = (persist) => {

  function makeLink(link) {
    link.addEventListener('click', (/*event*/) => {
      // event.preventDefault();
      if (persist && this.host === window.location.host) {
        localStorage.setItem('location', this.pathname + this.search);
      }
      window.location = this.href;
    }, false);
  }

  if (platform.iOS) {
    if (persist === null) persist = true;
    persist = persist && localStorage;
    if (persist) {
      const currentLocation = window.location.pathname + window.location.search;
      const storedLocation = localStorage.getItem('location');
      if (storedLocation && storedLocation !== currentLocation) {
        window.location = storedLocation;
      }
    }
    const links = document.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) makeLink(links[i]);
  }

};

// Save cookies in localstorage
//
api.dom.fixCookie = (sessionCookieName) => {
  if (localStorage && platform.iOS) {
    let cookieSession = document.cookie.match(
      new RegExp(sessionCookieName + '=[^;]+')
    );
    const localSession = localStorage.getItem(sessionCookieName);
    if (cookieSession) {
      cookieSession = cookieSession[0].replace(sessionCookieName + '=', '');
      if (localSession !== cookieSession) {
        localStorage.setItem(sessionCookieName, cookieSession);
      }
    } else if (localSession && localSession !== cookieSession) {
      document.cookie = sessionCookieName + '=' + localSession + '; path=/';
      window.location.reload(true);
    }
  }
};

// Get element by tag id
//
api.dom.id = id => document.getElementById(id);

if (document.getElementsByClassName) {
  api.dom.getElementsByClass = (classList, context) => (
    (context || document).getElementsByClassName(classList)
  );
} else {
  api.dom.getElementsByClass = (classList, context) => {
    context = context || document;
    const list = context.getElementsByTagName('*');
    const classArray = classList.split(/\s+/);
    const result = [];
    let i, j;
    for (i = 0; i < list.length; i++) {
      for (j = 0; j < classArray.length; j++) {
        if (list[i].className.search('\\b' + classArray[j] + '\\b') !== -1) {
          result.push(list[i]);
          break;
        }
      }
    }
    return result;
  };
}

// Add element class
//
api.dom.addClass = (element, className) => {
  element = api.dom.element(element);
  if (!element) return false;
  if (element.classList) {
    return element.classList.add(className);
  }
  const regex = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
  if (regex.test(element.className)) {
    element.className = (element.className + ' ' + className)
      .replace(/\s+/g, ' ')
      .replace(/(^ | $)/g, '');
    return element.className;
  }
};

// Remove element class
//
api.dom.removeClass = (element, className) => {
  element = api.dom.element(element);
  if (!element) return false;
  if (element.classList) {
    return element.classList.remove(className);
  }
  const regex = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
  element.className = element.className
    .replace(regex, '$1')
    .replace(/\s+/g, ' ')
    .replace(/(^ | $)/g, '');
};

// Check element class
//
api.dom.hasClass = (element, className) => {
  element = api.dom.element(element);
  if (!element) return false;
  if (element.classList) {
    return element.classList.contains(className);
  }
  return element.className.match(new RegExp('(^|\b)' + className + '($|\b)'));
};

// Toggle element class
//
api.dom.toggleClass = (element, className) => {
  element = api.dom.element(element);
  if (!element) return false;
  if (element.classList) {
    return element.classList.toggle(className);
  }
  element = api.dom.element(element);
  if (api.dom.hasClass(element, className)) {
    api.dom.removeClass(element, className);
  } else {
    api.dom.addClass(element, className);
  }
};

// Insert element after
//
api.dom.insertAfter = (parent, node, referenceNode) => {
  parent.insertBefore(node, referenceNode.nextSibling);
};

// Add element event
//
api.dom.addEvent = (element, event, fn) => {
  element = api.dom.element(element);
  if (!element) return false;
  if (element.addEventListener) {
    return element.addEventListener(event, fn, false);
  } else if (element.attachEvent) {
    const callback = () => {
      fn.call(element);
    };
    return element.attachEvent('on' + event, callback);
  } else return false;
};

// Remove element event
//
api.dom.removeEvent = function(element, event, fn) {
  if (arguments.length === 2) {
    fn = element;
    element = window;
  }
  element = api.dom.element(element);
  if (!element) return false;
  if (element.removeEventListener) {
    return element.removeEventListener(event, fn, false);
  } else if (element.detachEvent) {
    return element.detachEvent('on' + event, fn);
  } else return false;
};

// Events: 'load', 'unload', 'click', etc.
//
api.dom.on = function(event, element, fn) {
  if (arguments.length === 2) {
    fn = element;
    element = window;
  }
  api.dom.addEvent(element, event, fn);
};

// Use element or selector
//
api.dom.element = (element) => {
  if (typeof(element) !== 'string') {
    return element;
  }
  let result;
  try {
    //catching DOMException if element is not a valid selector
    result = document.querySelector(element);
  } catch (e) {
    result = null;
  }
  return result;
};

// Get page body reference
//
api.dom.on('load', () => {
  api.dom.body = document.body || document.getElementsByTagName('body')[0];
});

// fn(event) should terurn not empty string for confirmation dialog
//
api.dom.onBeforeUnload = (fn) => {
  api.dom.addEvent(api.dom, 'beforeunload', (event) => {
    const message = fn(event);
    if (typeof(event) === 'undefined') event = window.event;
    if (event) event.returnValue = message;
    return message;
  });
};

// Fire event
//
api.dom.fireEvent = (element, eventName) => {
  if (element.fireEvent) {
    element.fireEvent('on' + eventName);
  } else {
    const event = document.createEvent('Events');
    event.initEvent(eventName, true, false);
    element.dispatchEvent(event);
  }
};

// Enable element
//
api.dom.enable = (element, flag) => {
  if (flag) api.dom.removeClass(element, 'disabled');
  else api.dom.addClass(element, 'disabled');
};

// Visible element
//
api.dom.visible = (element, flag) => {
  if (flag) api.dom.show(element);
  else api.dom.hide(element);
};

// Toggle element
//
api.dom.toggle = (element) => {
  if (api.dom.hasClass(element, 'hidden')) api.dom.show(element);
  else api.dom.hide(element);
};

// Hide element
//
api.dom.hide = (element) => {
  if (!api.dom.hasClass(element, 'hidden')) {
    api.dom.addClass(element, 'hidden');
    element.setAttribute('_display', element.style.display);
    element.style.display = 'none';
  }
};

// Show element
//
api.dom.show = (element) => {
  if (api.dom.hasClass(element, 'hidden')) {
    api.dom.removeClass(element, 'hidden');
    element.style.display = element.getAttribute('_display') || '';
  }
};

// Load element content using AJAX
//
api.dom.load = (url, element, callback) => {
  element.innerHTML = '<div class="progress"></div>';
  api.ajax.get(url, {}, (err, res) => {
    element.innerHTML = res;
    if (callback) callback(err, res, element);
  });
};

// Center element
//
api.dom.alignCenter = (element, context, styles) => {
  let wrapper;
  const popupMargin = (element.style.margin.match(/\d+/) || [0])[0] || 0;

  if (api.dom.hasClass(element.parentNode, 'centering-wrapper')) {
    wrapper = element.parentNode;
  } else {
    wrapper = api.dom.wrapElement(element, 'centering-wrapper');
    if (styles) api.dom.setStyles(wrapper, styles);
    if (context && context.appendChild) {
      context.appendChild(wrapper);
    }
    api.dom.setStyles(wrapper, {
      'position': 'absolute',
      'z-index': '10',
      'text-align': 'center', //horizontal centering
      'overflow': 'hidden'
    });
    api.dom.setStyles(element, {
      'display': 'inline-block',  // text-like behaviour for centering
      'box-sizing': 'border-box', // include padding to height/width
      'text-align': 'initial',    // rewrite wrapper's value
      'line-height': 'normal',    // rewrite wrapper's value
      'vertical-align': 'middle'  // vertical centering
    });
  }
  api.dom.setStyles(wrapper, {
    'height': window.innerHeight + 'px',
    'width': window.innerWidth + 'px',
    'line-height': window.innerHeight + 'px' //vertical centering
  });
  api.dom.setStyles(element, {
    'max-width': (wrapper.offsetWidth - popupMargin * 2) + 'px',
    'max-height': (wrapper.offsetHeight - popupMargin * 2) + 'px'
  });

  return wrapper;
};

// Popup
//
api.dom.wrapElement = (element, classname) => {
  const wrapper = document.createElement('div');
  if (classname) api.dom.addClass(wrapper, classname);
  wrapper.appendChild(element);
  return wrapper;
};

api.dom.generateResizeHandler = (wrapper, popup, popupMargin) => (
  () => {
    api.dom.setStyles(wrapper, {
      'height': window.innerHeight + 'px',
      'width': window.innerWidth + 'px',
      'line-height': window.innerHeight + 'px'
    });
    api.dom.setStyles(popup, {
      'max-width': (wrapper.offsetWidth - popupMargin * 2) + 'px',
      'max-height': (wrapper.offsetHeight - popupMargin * 2) + 'px'
    });
  }
);

api.dom.generateClosePopup = (
  wrapper, content, resizeHandler, prevPlaceRefs
) => {
  const closePopup = (event) => {
    if (event.target !== wrapper && event.target !== closePopup.closeElement) {
      return true;
    }
    api.dom.setStyles(wrapper, {
      'opacity': '0'
    });
    setTimeout(() => {
      if (prevPlaceRefs.previousParent) {
        prevPlaceRefs.previousParent.insertBefore(
          content.childNodes.item(0),
          prevPlaceRefs.previousSibling
        );
      }
      api.dom.body.removeChild(wrapper);
      api.dom.body.style.overflow = api.dom.body.bodyPrevOverflow;
    }, 500); //wait 0.5s for animation end
    api.dom.removeEvent(wrapper, 'click', closePopup);
    api.dom.removeEvent('resize', resizeHandler);
    event.stopImmediatePropagation();
    return false;
  };
  return closePopup;
};

function injectInnerContent(content, contentHolder) {
  const contentNode = api.dom.element(content);
  let prevPlaceRefs;
  if (contentNode) {
    prevPlaceRefs = {};
    prevPlaceRefs.previousParent = contentNode.parentNode;
    prevPlaceRefs.previousSibling = contentNode.nextElementSibling;
    contentHolder.appendChild(contentNode);
  } else if (typeof(content) === 'string') {
    contentHolder.innerHTML = content;
  }
  return prevPlaceRefs;
}

api.dom.popup = (content) => {
  const popupMargin = 10;
  const popupPadding = {
    x: api.dom.detectScrollbarWidth() || 20,
    y: 20,
  };

  const popup = document.createElement('div');
  const contentHolder = document.createElement('div');

  popup.appendChild(contentHolder);

  api.dom.setStyles(popup, {
    'background': 'white',
    'box-shadow': '0 0 15px #333',
    'min-width': '300px',
    'min-height': '100px',
    'overflow': 'auto',
    'margin': popupMargin + 'px',
    'padding': popupPadding.y + 'px ' + popupPadding.x + 'px'
  });
  const wrapper = api.dom.alignCenter(popup, api.dom.body, {
    'transition': 'opacity 0.5s',
    'background': 'rgba(0, 0, 0, 0.5)',
    'opacity': '0'
  });
  api.dom.setStyles(wrapper, {
    'opacity': '1'
  });
  api.dom.setStyles(contentHolder, {
    'display': 'inline-block'
  });
  api.dom.body.bodyPrevOverflow = api.dom.body.style.overflow;
  api.dom.setStyles(api.dom.body, {
    'overflow': 'hidden'
  });
  const prevPlaceRefs = injectInnerContent(content, contentHolder);
  const resizeHandler = api.dom.alignCenter.bind(null, popup);
  const closePopup = api.dom.generateClosePopup(
    wrapper, contentHolder, resizeHandler, prevPlaceRefs
  );
  api.dom.on('resize', resizeHandler);
  api.dom.on('click', wrapper, closePopup);
  return closePopup;
};

api.dom.detectScrollbarWidth = () => {
  const scrollDiv = document.createElement('div');
  api.dom.setStyles(scrollDiv, {
    'width': '100px',
    'height': '100px',
    'overflow': 'scroll',
    'position': 'absolute',
    'top': '-9999px'
  });
  api.dom.body.appendChild(scrollDiv);

  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
};

function dashedToUpperCase(key) {
  return key.replace(/-(\w)/g, (match, p1) =>
     p1.toUpperCase()
  );
}

// transform CSS string to Object
//
const cssStringToObject = (styles) => {
  if (typeof(styles) === 'string') {
    const stylesStr = styles;
    styles = {};
    stylesStr.split(/\s*;\s*/).filter(Boolean).forEach((val) => {
      // split by first ':'
      const delimPos = val.search(/\s*:\s*/);
      const delimLength = val.match(/\s*:\s*/)[0].length;
      const key = val.substr(0, delimPos);
      val = val.substr(delimPos + delimLength);
      styles[key] = val; //storing to object
    });
  }
  return styles;
};

function extractPrefixedStyles(styleName) {
  styleName = styleName || styleName;
  const keys = [styleName];
  // adding vendor prefixes if needed
  for (const pref in api.dom.styleProps) {
    const list = api.dom.styleProps[pref];
    if (list.includes(styleName)) {
      keys.push('-' + pref + '-' + styleName);
    }
  }
  return keys;
}

// Set given styles to element
//
api.dom.setStyles = (element, styles) => {
  styles = cssStringToObject(styles);
  if (typeof(styles) !== 'object') return false;

  for (const styleName in styles) {
    if (!styles[styleName]) break;
    const styleNames = extractPrefixedStyles(styleName);
    for (const dashedName in styleNames) {
      const key = dashedToUpperCase(styleNames[dashedName]);
      element.style[key] = styles[styleName];
    }
  }
  return true;
};

api.dom.styleProps = {
  // taken from Emmet lib
  // https://github.com/emmetio/emmet/blob/master/lib/resolver/css.js#L155
  webkit: [
    'animation', 'animation-delay', 'animation-direction', 'animation-duration',
    'animation-fill-mode', 'animation-iteration-count', 'animation-name',
    'animation-play-state', 'animation-timing-function', 'appearance',
    'backface-visibility', 'background-clip', 'background-composite',
    'background-origin', 'background-size', 'border-fit',
    'border-horizontal-spacing', 'border-image', 'border-vertical-spacing',
    'box-align', 'box-direction', 'box-flex', 'box-flex-group', 'box-lines',
    'box-ordinal-group', 'box-orient', 'box-pack', 'box-reflect', 'box-shadow',
    'color-correction', 'column-break-after', 'column-break-before',
    'column-break-inside', 'column-count', 'column-gap', 'column-rule-color',
    'column-rule-style', 'column-rule-width', 'column-span', 'column-width',
    'dashboard-region', 'font-smoothing', 'highlight', 'hyphenate-character',
    'hyphenate-limit-after', 'hyphenate-limit-before', 'hyphens',
    'line-box-contain', 'line-break', 'line-clamp', 'locale',
    'margin-before-collapse', 'margin-after-collapse', 'marquee-direction',
    'marquee-increment', 'marquee-repetition', 'marquee-style',
    'mask-attachment', 'mask-box-image', 'mask-box-image-outset',
    'mask-box-image-repeat', 'mask-box-image-slice', 'mask-box-image-source',
    'mask-box-image-width', 'mask-clip', 'mask-composite', 'mask-image',
    'mask-origin', 'mask-position', 'mask-repeat', 'mask-size', 'nbsp-mode',
    'perspective', 'perspective-origin', 'rtl-ordering', 'text-combine',
    'text-decorations-in-effect', 'text-emphasis-color',
    'text-emphasis-position', 'text-emphasis-style', 'text-fill-color',
    'text-orientation', 'text-security', 'text-stroke-color',
    'text-stroke-width', 'transform', 'transition', 'transform-origin',
    'transform-style', 'transition-delay', 'transition-duration',
    'transition-property', 'transition-timing-function', 'user-drag',
    'user-modify', 'user-select', 'writing-mode', 'svg-shadow', 'box-sizing',
    'border-radius'
  ],
  moz: [
    'animation-delay', 'animation-direction', 'animation-duration',
    'animation-fill-mode', 'animation-iteration-count', 'animation-name',
    'animation-play-state', 'animation-timing-function', 'appearance',
    'backface-visibility', 'background-inline-policy', 'binding',
    'border-bottom-colors', 'border-image', 'border-left-colors',
    'border-right-colors', 'border-top-colors', 'box-align', 'box-direction',
    'box-flex', 'box-ordinal-group', 'box-orient', 'box-pack', 'box-shadow',
    'box-sizing', 'column-count', 'column-gap', 'column-rule-color',
    'column-rule-style', 'column-rule-width', 'column-width', 'float-edge',
    'font-feature-settings', 'font-language-override',
    'force-broken-image-icon', 'hyphens', 'image-region', 'orient',
    'outline-radius-bottomleft', 'outline-radius-bottomright',
    'outline-radius-topleft', 'outline-radius-topright', 'perspective',
    'perspective-origin', 'stack-sizing', 'tab-size', 'text-blink',
    'text-decoration-color', 'text-decoration-line', 'text-decoration-style',
    'text-size-adjust', 'transform', 'transform-origin', 'transform-style',
    'transition', 'transition-delay', 'transition-duration',
    'transition-property', 'transition-timing-function', 'user-focus',
    'user-input', 'user-modify', 'user-select', 'window-shadow',
    'background-clip', 'border-radius'
  ],
  ms: [
    'accelerator', 'backface-visibility', 'background-position-x',
    'background-position-y', 'behavior', 'block-progression', 'box-align',
    'box-direction', 'box-flex', 'box-line-progression', 'box-lines',
    'box-ordinal-group', 'box-orient', 'box-pack', 'content-zoom-boundary',
    'content-zoom-boundary-max', 'content-zoom-boundary-min',
    'content-zoom-chaining', 'content-zoom-snap', 'content-zoom-snap-points',
    'content-zoom-snap-type', 'content-zooming', 'filter', 'flow-from',
    'flow-into', 'font-feature-settings', 'grid-column', 'grid-column-align',
    'grid-column-span', 'grid-columns', 'grid-layer', 'grid-row',
    'grid-row-align', 'grid-row-span', 'grid-rows', 'high-contrast-adjust',
    'hyphenate-limit-chars', 'hyphenate-limit-lines', 'hyphenate-limit-zone',
    'hyphens', 'ime-mode', 'interpolation-mode', 'layout-flow', 'layout-grid',
    'layout-grid-char', 'layout-grid-line', 'layout-grid-mode',
    'layout-grid-type', 'line-break', 'overflow-style', 'perspective',
    'perspective-origin', 'perspective-origin-x', 'perspective-origin-y',
    'scroll-boundary', 'scroll-boundary-bottom', 'scroll-boundary-left',
    'scroll-boundary-right', 'scroll-boundary-top', 'scroll-chaining',
    'scroll-rails', 'scroll-snap-points-x', 'scroll-snap-points-y',
    'scroll-snap-type', 'scroll-snap-x', 'scroll-snap-y',
    'scrollbar-arrow-color', 'scrollbar-base-color',
    'scrollbar-darkshadow-color', 'scrollbar-face-color',
    'scrollbar-highlight-color', 'scrollbar-shadow-color',
    'scrollbar-track-color', 'text-align-last', 'text-autospace',
    'text-justify', 'text-kashida-space', 'text-overflow', 'text-size-adjust',
    'text-underline-position', 'touch-action', 'transform', 'transform-origin',
    'transform-origin-x', 'transform-origin-y', 'transform-origin-z',
    'transform-style', 'transition', 'transition-delay', 'transition-duration',
    'transition-property', 'transition-timing-function', 'user-select',
    'word-break', 'wrap-flow', 'wrap-margin', 'wrap-through', 'writing-mode'
  ],
  o: [
    'dashboard-region', 'animation', 'animation-delay', 'animation-direction',
    'animation-duration', 'animation-fill-mode', 'animation-iteration-count',
    'animation-name', 'animation-play-state', 'animation-timing-function',
    'border-image', 'link', 'link-source', 'object-fit', 'object-position',
    'tab-size', 'table-baseline', 'transform', 'transform-origin', 'transition',
    'transition-delay', 'transition-duration', 'transition-property',
    'transition-timing-function', 'accesskey', 'input-format', 'input-required',
    'marquee-dir', 'marquee-loop', 'marquee-speed', 'marquee-style'
  ]
};

// Confirmation dialog
//   Buttons: ['Yes', 'No', 'Ok', 'Cancel']
//
api.dom.confirmation = (title, message, eventYes, buttons) => {
  // TODO: implement api.dom.confirmation
};

// Input dialog
//
api.dom.input = (title, prompt, defaultValue, eventOk) => {
};

// Call disableSelection on page load with element to disable or
// without parameters to disable selection in whole page
//
api.dom.disableSelection = (target) => {
  target = target || api.dom.html;
  if (typeof(target.onselectstart) !== 'undefined') {
    target.onselectstart = api.common.falseness; // For IE
  } else if (typeof(target.style.MozUserSelect) !== 'undefined') {
    // For Firefox
    target.style.MozUserSelect = 'none';
    // if (target === body || target === api.dom.html)
    //   for (let i = 0; i < body.children.length; i++)
    //     body.children[i].style.MozUserSelect='none';
  } else {
    target.onmousedown = api.common.falseness; // All other browsers (Opera)
  }
  target.style.cursor = 'default';
};

// Disable browser context menu
//
api.dom.disableContextMenu = (target) => {
  target = target || api.dom.html;
  api.dom.addEvent(document, 'contextmenu', (event) => {
    event = event || window.event;
    if (document.addEventListener) event.preventDefault();
    else event.returnValue = false;
  });
};

// Disable browser content copy function
//
api.dom.disableCopy = (target) => {
  target = target || api.dom.html;
  const fn = (event) => {
    event = event || window.event;
    if (api.dom.clipboardData) api.dom.clipboardData.setData('Text', '');
    event.returnValue = false;
    if (event.preventDefault) event.preventDefault();
    return false;
  };
  api.dom.addEvent(target, 'copy', fn);

  /*api.dom.addEvent(target, 'keydown', (event) => {
    event = event || window.event;
    event.returnValue = false;
    let key = event.keyCode;
    let ctrlDown = event.ctrlKey || event.metaKey; // Mac support
    let result = true;

    console.log('key=' + key + ' ctrlDown=' + ctrlDown);
    // Check for Alt+Gr (http://en.wikipedia.org/wiki/AltGr_key)
    if (ctrlDown && event.altKey) result = true;
    else if (ctrlDown && key === 67) result = false  // ctrl+c
    else if (ctrlDown && key === 86) result = false  // ctrl+v
    else if (ctrlDown && key === 88) result = false; // ctrl+x

    event.returnValue = result;
    return result;
  });*/
};

// Escape HTML
//
api.dom.htmlEscape = (content) => (
  content.replace(/[&<>"'\/]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'
  }[char]))
);

// Simple string template
//
api.dom.template = (tpl, data, escapeHtml) => (
  tpl.replace(/@([\-\.0-9a-zA-Z]+)@/g, (s, key) => (
    escapeHtml ? api.dom.htmlEscape(data[key]) : data[key]
  ))
);

// Simple HTML template
//
api.dom.templateHtml = (tpl, data) => (
  api.dom.template(tpl, data, true)
);

// Cookie utils
//
api.cookie = {};

// Get cookie value by name
//
api.cookie.get = (name) => {
  const matches = document.cookie.match(new RegExp(
    '(?:^|; )' +
    name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
    '=([^;]*)'
  ));
  return matches ? decodeURIComponent(matches[1]) : false;
};

// Set cookie value
//
api.cookie.set = (name, value) => {
  const cookie = name + '=' + escape(value) + '; path=/';
  document.cookie = cookie;
};

// Delete cookie value
//
api.cookie.delete = (name) => {
  api.cookie.set(name, null, { expires: -1 });
};

// Tabs API
//
api.tabs = new api.events.EventEmitter();
api.tabs.tabId = 0;
api.tabs.tabKey = '';
api.tabs.masterTab = false;
api.tabs.masterTabId = 0;
api.tabs.masterTabKey = '';
api.tabs.heartbeatInterval = 2000;
api.tabs.heartbeatEvent = null;
api.tabs.initialized = false;
api.tabs.initializationCallbacks = [];
api.tabs.supportsLocalStorage = false;

// localStorage structure:
//   api.tabs.master = tabId e.g. 1
//   api.tabs.tab1 = Date.now() e.g. 1424185702490
//   api.tabs.tab2 = Date.now() e.g. 1424185704772
//   api.tabs.newtab = tabId (signal to master)
//   api.tabs.event = signal in format { name:s, data:d, time: Date.now() }
//
api.tabs.initializationWait = (callback) => {
  if (!api.tabs.initialized) {
    api.tabs.initializationCallbacks.push(callback);
  } else {
    callback();
  }
};

// Initialize tabs
//
api.tabs.initialize = () => {
  api.tabs.supportsLocalStorage = (
    'localStorage' in window && window.localStorage !== null
  );
  if (api.tabs.supportsLocalStorage) api.tabs.initializeConnection();
};

// Initialize tabs done
//
api.tabs.initializeDone = () => {
  api.tabs.heartbeatEvent = setInterval(
    api.tabs.listenHandler, api.tabs.heartbeatInterval
  );
  api.tabs.initialized = true;
  api.tabs.initializationCallbacks.forEach((callback) => {
    callback();
  });
  api.tabs.initializationCallbacks = [];
};

// Get free browser tab
//
api.tabs.getFreeTab = () => {
  for (let id = 1; ;id++) {
    if (typeof(localStorage['impress.tab' + id]) === 'undefined') return id;
  }
};

// Initialize tabs connection
//
api.tabs.initializeConnection = () => {
  if (!api.tabs.initialized) {
    api.tabs.tabId = api.tabs.getFreeTab();
    api.tabs.tabKey = 'impress.tab' + api.tabs.tabId;
    api.tabs.heartbeat();
    api.tabs.heartbeatEvent = setInterval(
      api.tabs.heartbeat, api.tabs.heartbeatInterval
    );
    localStorage['impress.newtab'] = api.tabs.tabId;
    global.addEventListener('storage', api.tabs.onStorageChange, false);
  }
  const master = localStorage['impress.master'];
  if (master) api.tabs.setMaster(master);
  else api.tabs.createMaster();
  api.tabs.initializeDone();
};

// Master tab heartbeat
//
api.tabs.heartbeat = () => {
  localStorage[api.tabs.tabKey] = Date.now();
  if (api.tabs.masterTab) api.tabs.checkTabs();
  else api.tabs.checkMaster();
};

// Check master tab
//
api.tabs.checkMaster = () => {
  const masterNow = parseInt(localStorage[api.tabs.masterTabKey], 10);
  if (Date.now() - masterNow > api.tabs.heartbeatInterval * 2) {
    let tabId, tabNow, key;
    const keys = Object.keys(localStorage);
    let maxId = 0;
    const now = Date.now();
    for (let i = 0; i < keys.length; i++) {
      key = keys[i];
      if (key.indexOf('impress.tab') === 0) {
        tabId = parseInt(key.match(/\d+/)[0], 10);
        tabNow = parseInt(localStorage[key], 10);
        if (now - tabNow < api.tabs.heartbeatInterval * 2 && tabId > maxId) {
          maxId = tabId;
        }
      }
    }
    if (maxId === api.tabs.tabId) api.tabs.createMaster();
  }
};

// Check browser babs
//
api.tabs.checkTabs = () => {
  let tabNow, key;
  const keys = Object.keys(localStorage);
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    if (key !== api.tabs.tabKey && key.indexOf('impress.tab') === 0) {
      tabNow = parseInt(localStorage[key], 10);
      if (Date.now() - tabNow > api.tabs.heartbeatInterval * 2) {
        localStorage.removeItem(key);
      }
    }
  }
};

// Set master tab
//
api.tabs.setMaster = (id) => {
  api.tabs.masterTab = false;
  api.tabs.masterTabId = id;
  api.tabs.masterTabKey = 'impress.tab' + id;
};

// Create master tab
//
api.tabs.createMaster = () => {
  api.tabs.masterTab = true;
  api.tabs.masterTabId = api.tabs.tabId;
  api.tabs.masterTabKey = api.tabs.tabKey;
  localStorage['impress.master'] = api.tabs.tabId;
  api.tabs.initializeDone();
};

// Impress cross-tab communication using localstorage
//
api.tabs.onStorageChange = (e) => {
  if (e.key === 'impress.event') {
    const event = JSON.parse(e.newValue);
    api.tabs.emit(event.name, event.data);
  } else if (api.tabs.masterTab) {
    if (e.key === 'impress.newtab') {
      api.tabs.heartbeat();
    } else if (e.key === 'impress.master') {
      console.log('WARNING: master collision');
    }
  } else if (e.key === 'impress.master') {
    api.tabs.setMaster(e.newValue);
  }
};

// Emit cross-tab event
//
api.tabs.emitTabs = (name, data) => {
  localStorage['impress.event'] = JSON.stringify({
    name, data, time: Date.now()
  });
};

// Initialize tabs modile
//
api.tabs.initialize();

// Prepare AJAX namespace stub
//
api.ajax = (methods) => {
  // params: { method: { get/post:url }, ... }

  function createMethod(apiStub, apiMethod) {
    if (apiMethod === 'introspect') {
      apiStub[apiMethod] = (params, callback) => {
        apiStub.request(apiMethod, params, (err, data) => {
          apiStub.init(data);
          callback(err, data);
        });
      };
    } else {
      apiStub[apiMethod] = (params, callback) => {
        apiStub.request(apiMethod, params, callback);
      };
    }
  }

  const apiStub = {};

  apiStub.request = function(apiMethod, params, callback) {
    let err = null;
    const requestParams = this.methods[apiMethod];
    if (requestParams) {
      let httpMethod, url;
      if (requestParams.get) { httpMethod = 'GET'; url = requestParams.get; }
      if (requestParams.post) { httpMethod = 'POST'; url = requestParams.post; }
      if (httpMethod) {
        api.ajax.request(httpMethod, url, params, true, callback);
        return;
      } else err = new Error('DataSource error: HTTP method is not specified');
    } else err = new Error('DataSource error: AJAX method is not specified');
    callback(err, null);
  };

  apiStub.init = (methods) => {
    apiStub.methods = methods;
    for (const apiMethod in apiStub.methods) createMethod(apiStub, apiMethod);
  };

  apiStub.init(methods);
  return apiStub;

};

// Data source abstract interface
//
// just abstract, see implementation below
// should be implemented methods:
//   read(query, callback)   return one record as object, callback(err, obj)
//   insert(obj, callback)   insert one record, callback(err) on done
//   update(obj, callback)   update one record, callback(err) on done
//   delete(query, callback) delete multiple records, callback(err) on done
// may be implemented methods:
//   introspect(params, callback) get dataSource.methods from server metadata
//   metadata(params, callback)   get dataSource.metadata from server metadata
//   find(query, callback)        return multiple records: callback(err, Array)

// AJAX data source interface
//
api.ajax.ajaxDataSource = (methods) => {
  const ds = api.ajax.ajax(methods);
  ds.read = (query, callback) => {
    ds.request('read', query, (err, data) => {
      // autocreate Record
      //   callback(err, api.ajax.record({ data: data }));
      //
      callback(err, data);
    });
  };
  return ds;
};

// Send HTTP request
//   method - HTTP verb (string)
//   url - request URL (string)
//   params - request parameters (hash, optional)
//   parseResponse - boolean flag to parse JSON (boolean, optional)
//   callback - function to call on response received
//
api.ajax.request = (method, url, params, parseResponse, callback) => {
  let key, value = '', data = [];
  const req = new XMLHttpRequest();
  req.open(method, url, true);
  for (key in params) {
    if (!params.hasOwnProperty(key)) continue;
    value = params[key];
    if (typeof(value) !== 'string') value = JSON.stringify(value);
    data.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  }
  data = data.join('&');
  req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.onreadystatechange = () => {
    if (req.readyState === 4) {
      let err = null, res = req.responseText;
      if (req.status === 0 || req.status === 200) {
        if (parseResponse) {
          try {
            res = JSON.parse(res);
          } catch (e) {
            err = new Error('JSON parse code: ' + e);
          }
        }
      } else err = new Error('HTTP error code: ' + req.status);
      if (callback) callback(err, res);
    }
  };
  req.send(data);
};

// Send HTTP GET request
//
api.ajax.get = function(url, params, callback) {
  if (arguments.length === 2) {
    callback = params;
    params = {};
  }
  api.ajax.request('GET', url, params, true, callback);
};

// Send HTTP POST request
//
api.ajax.post = function(url, params, callback) {
  if (arguments.length === 2) {
    callback = params;
    params = {};
  }
  api.ajax.request('POST', url, params, true, callback);
};

// Create websocket instance
//
api.ws = (url) => {

  const ws = new api.events.EventEmitter();
  const socket = new WebSocket(api.common.absoluteUrl(url));

  ws.socket = socket;

  socket.onopen = () => {
    ws.emit('open');
  };

  socket.onclose = () => {
    ws.emit('close');
  };

  socket.onmessage = (event) => {
    ws.emit('message', event);
  };

  ws.close = () => {
    socket.close();
    ws.socket = null;
  };

  ws.send = (data) => {
    socket.send(data);
  };

  return ws;

};

// Create Server-Sent Events instance
//
api.sse = (url) => {
  const sse = new EventSource(url);
  sse.on = sse.addEventListener;
  return sse;
};

// Client-side load balancer
//
application.balancer = {};
application.balancer.servers = {};
application.balancer.sequence = [];
application.balancer.sequenceIndex = 0;
application.balancer.currentServer = null;
application.balancer.currentNode = null;
application.balancer.currentRetry = 0;
application.balancer.currentRetryMax = 10;
application.balancer.globalRetry = 0;
application.balancer.retryInterval = 3000;

// Main Impress binding to server-side
//   TODO: use JSTP here after get ip:port from balancer
//
/*
application.connect = function(callback) {
  api.ajax.get('/api/application/balancer.json', {}, function(err, res) {
    if (!err) {
      application.balancer.servers = res.servers;
      application.balancer.generateSequence();
      application.reconnect();
      if (callback) application.on('connect', callback);
    }
  });
};

application.reconnect = function() {
  let node = application.balancer.getNextNode();
  let schema = node.server.secure ? 'wss' : 'ws';
  let path = '/examples/impress.rpc';
  let url = schema + '://' + node.host + path;
  application.rpc = api.rpc(url);
  application.rpc.on('open', () => {
    application.connect.url = url;
    console.log('opened ' + url);
  });
  application.rpc.on('close', () => {
    console.log('closed ' + url);
    setTimeout(() => {
      application.reconnect();
    }, application.balancer.retryInterval);
  });
};
*/

application.balancer.generateSequence = () => {
  let i, server, serverName;
  const servers = application.balancer.servers;
  if (servers) {
    for (serverName in servers) {
      server = servers[serverName];
      for (i = 0; i < server.ports.length; i++) {
        application.balancer.sequence.push({
          server,
          host: server.host + ':' + server.ports[i]
        });
      }
    }
  }
};

application.balancer.getNextNode = () => {
  const balancer = application.balancer;
  balancer.globalRetry++;
  if (balancer.currentRetry < balancer.currentRetryMax) {
    // Next retry
    balancer.currentRetry++;
  } else {
    // New node
    balancer.currentRetry = 0;
    if (balancer.sequenceIndex < balancer.sequence.length) {
      // Next node
      balancer.sequenceIndex++;
    } else {
      // First node
      balancer.sequenceIndex = 0;
    }
  }
  const node = balancer.sequence[balancer.sequenceIndex];
  balancer.currentNode = node;
  balancer.currentServer = node.server;
  return node;
};
