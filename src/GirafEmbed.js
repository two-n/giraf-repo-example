function deparam (querystring) {
  var querystring = (querystring || '').split('&')
  var params = {}
  var pair, i = querystring.length
  while (i > 0) {
    pair = querystring[--i].split('=')
    if (pair[0]) {
      params[ decodeURIComponent(pair[0]) ] = decodeURIComponent(pair[1])
    }
  }
  return params
}

function createEmbed (name, initPlayer, opts) {
  opts = opts || {}
  opts.namespace = opts.namespace || 'GirafEmbed'
  opts.requiredParams = opts.requiredParams || false

  var App = window[opts.namespace] = window[opts.namespace] || {}
  App.players = App.players || []
  App.playersNamed = App.playersNamed || {}

  var embedScripts = App.scripts = App.scripts || []
  var scripts = document.getElementsByTagName('script')
  var regex = new RegExp('.*/' + name + '/\.*js', 'i')

  for(var script, i = 0; i < scripts.length; i++) {
    script = scripts[i]
    if (!regex.test(script.src) && script.getAttribute('data-name') !== name) { continue; }

    embedScripts.push(script)
    var params = script.src.split('#')[1]
    if (opts.requiredParams && !params) {
      throw new Error('Missing parameters hash (ie # followed by a querystring)')
    }

    var el, player = deparam(params);
    player.id   = script.getAttribute('data-id');
    player.name = script.getAttribute('data-name');
    player.host = player.host || script.src.match(/.*\:\/\/[^\/]*/)[0] || '';
    player.directory = script.src.match(/(.*\/)[^/]*/)[1]
    if (player.noElement == 'true') {
      player.noElement = true;
      el = script.parentNode;
    } else {
      el = document.createElement(player.tag || 'div');
      el.setAttribute('class', [opts.namespace + '-embed', name, player.name || ''].join(' '));
      player.id && el.setAttribute('id', player.id);
      script.parentNode.insertBefore(el, script);
    }

    player.status = 'initializing';
    player.el = el;

    if (!player.height) {
      // If height not explicitly specified, try to glean it from the
      // container. If that fails (or comes out 0), then default to 'auto'
      var style = window.getComputedStyle(el, null);
      player.height = parseInt(style.getPropertyValue("height")) || 'auto';
    }

    App.players.push(player);
    if (player.name) { App.playersNamed[player.name] = player; }

    // Only need to do this once, even if there are multiple players
    if (opts.initApp && embedScripts.length == 1) {
      opts.initApp(App);
    }

    // see if there's a players object with config info
    var players = App.player || App.players;
    if (!Array.isArray(players)) { players = [players]; }

    // find the first player that's not yet processed
    for (var player, j = 0; j < players.length; j++) {
      player = players[j]
      if (player.status && player.status !== 'initializing') { continue; }

      player.impl = initPlayer(player, App);
    }
  }
}

function loadStylesheet(url, callback) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.type = 'text/css';
  l.href = url
  document.getElementsByTagName('head')[0].appendChild(l)
  callback && callback()
}

function onResize (fn) {
  window.addEventListener('resize', fn)
}

module.exports = { createEmbed, loadStylesheet, onResize } ;
