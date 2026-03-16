(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────

  var hiddenInput = null;
  var currentInputSpan = null;
  var cursorSpan = null;
  var promptDiv = null;
  var bodyEl = null;
  var commandHistory = [];
  var historyIndex = -1;
  var tabMatches = [];
  var tabIndex = -1;
  var HINT_TEXT = "type 'ls' to explore or 'help' for all commands";

  // ─── Command Registry ─────────────────────────────────────────────────────

  var COMMANDS = [
    {
      name: 'ls',
      description: 'List available files',
      handler: function () {
        return 'about.txt  contact.txt  experience.txt  projects/  skills/';
      }
    },
    {
      name: 'motd',
      description: 'Show message of the day',
      handler: function () {
        return document.querySelector('.banner').cloneNode(true);
      }
    },
    {
      name: 'whoami',
      description: 'Print current user',
      handler: function () {
        return 'lucas messenger \u2014 security engineer @ aws';
      }
    },
    {
      name: 'cat about.txt',
      hidden: true,
      completable: true,
      handler: function () {
        return document.getElementById('out-about').cloneNode(true);
      }
    },
    {
      name: 'cat experience.txt',
      hidden: true,
      completable: true,
      handler: function () {
        return document.getElementById('out-experience').cloneNode(true);
      }
    },
    {
      name: 'cat contact.txt',
      hidden: true,
      completable: true,
      handler: function () {
        return document.getElementById('out-contact').cloneNode(true);
      }
    },
    {
      name: 'ls skills/',
      hidden: true,
      completable: true,
      handler: function () {
        return document.getElementById('out-skills').cloneNode(true);
      }
    },
    {
      name: 'ls projects/',
      hidden: true,
      completable: true,
      handler: function () {
        return document.getElementById('out-projects').cloneNode(true);
      }
    },
    {
      name: 'help',
      description: 'List available commands',
      handler: function () {
        return COMMANDS.filter(function (c) { return !!c.description; }).map(function (c) {
          return c.name + '  \u2014  ' + c.description;
        }).join('\n');
      }
    },
    {
      name: 'clear',
      description: 'Clear the terminal',
      handler: function () { clearTerminal(); return null; }
    },
    { name: 'sudo', prefix: true, handler: function () { return 'sudo: you wish'; } },
    { name: 'rm', prefix: true, handler: function () { return 'nice try. i work in security.'; } },
    {
      name: 'ssh',
      prefix: true,
      handler: function (arg) {
        return 'ssh: connect to host ' + (arg || 'localhost') + ' port 22: Connection refused';
      }
    },
    {
      name: 'nmap',
      prefix: true,
      handler: function (arg) {
        var host = arg || 'localhost';
        return 'Starting Nmap 7.94\nPORT     STATE  SERVICE\n22/tcp   open   ssh\n443/tcp  open   https\n1337/tcp open   unknown\nNmap done: ' + host + ' (1 host up)';
      }
    },
    {
      name: 'curl',
      prefix: true,
      handler: function (arg) {
        return "curl: could not resolve host '" + (arg || 'unknown') + "'";
      }
    },
    { name: 'hack', handler: function () { return '...initializing. just kidding.'; } },
    {
      name: 'ping',
      prefix: true,
      handler: function (arg) {
        var host = arg || '8.8.8.8';
        return 'PING ' + host + ' (' + host + ')\n64 bytes from ' + host + ': icmp_seq=1 ttl=118 time=11.2 ms\n64 bytes from ' + host + ': icmp_seq=2 ttl=118 time=10.8 ms\n--- ' + host + ' ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss';
      }
    },
    {
      name: 'uname',
      prefix: true,
      handler: function () {
        return 'layertwo.dev 6.1.0-security #1 SMP PREEMPT Mon Jan 01 00:00:00 UTC 2026 x86_64 GNU/Linux';
      }
    }
  ];

  // ─── Witty errors ─────────────────────────────────────────────────────────

  var WITTY_ERRORS = [
    "that's not a command. try 'help'.",
    "command not found. are you guessing?",
    "nope. type 'help' to see what's available.",
    "unknown command. this isn't bash.",
    "404: command not found."
  ];
  var wittyIndex = 0;

  // ─── Fuzzy Matcher ────────────────────────────────────────────────────────

  function levenshtein(a, b) {
    var m = a.length, n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = [i];
      for (var j = 1; j <= n; j++) {
        dp[i][j] = i === 0 ? j
          : j === 0 ? i
          : a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function findSuggestion(input) {
    var inputBase = input.split(' ')[0];
    var best = null, bestDist = Infinity;
    COMMANDS.forEach(function (cmd) {
      var dist = levenshtein(cmd.prefix ? inputBase : input, cmd.name);
      if (dist < bestDist) { bestDist = dist; best = cmd.name; }
    });
    return bestDist <= 2 ? best : null;
  }

  // ─── Renderer ─────────────────────────────────────────────────────────────

  function appendToBody(el) {
    bodyEl.insertBefore(el, promptDiv);
    promptDiv.scrollIntoView({ block: 'nearest' });
  }

  function renderCommand(text) {
    var el = document.createElement('div');
    el.className = 'command-end';
    el.style.marginTop = '0.75rem';
    var span = document.createElement('span');
    span.textContent = text;
    el.appendChild(span);
    appendToBody(el);
  }

  function renderOutput(output) {
    if (output === null) return;
    if (typeof output === 'string') {
      var el = document.createElement('div');
      el.className = 'log out';
      el.style.whiteSpace = 'pre';
      el.textContent = output;
      appendToBody(el);
    } else {
      // DOM element returned by handler — strip animation classes before appending
      output.style.animation = 'none';
      output.querySelectorAll('*').forEach(function (child) {
        child.style.animation = 'none';
      });
      appendToBody(output);
    }
  }

  function renderError(msg) {
    var el = document.createElement('div');
    el.className = 'log out';
    el.style.color = 'var(--dim)';
    el.textContent = msg;
    appendToBody(el);
  }

  function clearTerminal() {
    var banner = bodyEl.querySelector('.banner');
    bodyEl.innerHTML = '';
    if (banner) bodyEl.appendChild(banner);
    var hint = document.createElement('div');
    hint.className = 'log out';
    hint.textContent = HINT_TEXT;
    bodyEl.appendChild(hint);
    var prompt = document.createElement('div');
    prompt.className = 'command-end';
    var inputSpan = document.createElement('span');
    inputSpan.className = 'current-input';
    var cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = '▌';
    prompt.appendChild(inputSpan);
    prompt.appendChild(cursor);
    bodyEl.appendChild(prompt);
    promptDiv = prompt;
    currentInputSpan = inputSpan;
    cursorSpan = cursor;
    if (hiddenInput) hiddenInput.focus();
  }

  // ─── Input Handler ────────────────────────────────────────────────────────

  function execute(raw) {
    var input = raw.trim();
    if (!input) return;

    commandHistory.push(input);
    historyIndex = -1;

    renderCommand(input);

    var matched = COMMANDS.find(function (cmd) {
      if (cmd.prefix) return input === cmd.name || input.indexOf(cmd.name + ' ') === 0;
      return cmd.name === input;
    }) || null;

    if (matched) {
      var arg = matched.prefix ? input.slice(matched.name.length).trim() : undefined;
      var result = matched.handler(arg);
      renderOutput(result);
    } else {
      var suggestion = findSuggestion(input);
      if (suggestion) {
        renderError('command not found: ' + input + ' \u2014 did you mean \'' + suggestion + '\'?');
      } else {
        renderError(WITTY_ERRORS[wittyIndex % WITTY_ERRORS.length]);
        wittyIndex++;
      }
    }
  }

  function tabComplete() {
    var input = hiddenInput.value;
    if (!input) return;
    if (tabMatches.length === 0) {
      var completable = COMMANDS.filter(function (c) { return !c.hidden || c.completable; });
      tabMatches = completable.filter(function (c) { return c.name.indexOf(input) === 0; });
      if (tabMatches.length === 0) return;
      tabIndex = 0;
    } else {
      tabIndex = (tabIndex + 1) % tabMatches.length;
    }
    hiddenInput.value = tabMatches[tabIndex].name;
    currentInputSpan.textContent = hiddenInput.value;
  }

  function init() {
    var terminal = document.querySelector('.terminal');
    bodyEl = document.querySelector('.terminal-body');
    promptDiv = document.querySelector('.command-end');
    currentInputSpan = document.querySelector('.current-input');
    cursorSpan = document.querySelector('.cursor');

    // Invisible input to capture keystrokes
    hiddenInput = document.createElement('input');
    hiddenInput.type = 'text';
    hiddenInput.setAttribute('autocomplete', 'off');
    hiddenInput.setAttribute('autocorrect', 'off');
    hiddenInput.setAttribute('autocapitalize', 'off');
    hiddenInput.setAttribute('spellcheck', 'false');
    hiddenInput.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;';
    document.body.appendChild(hiddenInput);

    // Focus input on terminal click or on load
    terminal.addEventListener('click', function () { hiddenInput.focus(); });
    hiddenInput.focus();

    hiddenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        tabComplete();
        return;
      }
      if (tabMatches.length) { tabMatches = []; tabIndex = -1; }
      if (/^(Shift|Control|Alt|Meta|CapsLock)$/.test(e.key)) return;

      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        renderCommand(hiddenInput.value + '^C');
        hiddenInput.value = '';
        currentInputSpan.textContent = '';
        cursorSpan.style.animationPlayState = 'running';
        return;
      }

      if (e.key === 'Enter') {
        var val = hiddenInput.value;
        hiddenInput.value = '';
        currentInputSpan.textContent = '';
        cursorSpan.style.animationPlayState = 'running';
        execute(val);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          hiddenInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
          currentInputSpan.textContent = hiddenInput.value;
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          hiddenInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
        } else {
          historyIndex = -1;
          hiddenInput.value = '';
        }
        currentInputSpan.textContent = hiddenInput.value;
        return;
      }
    });

    hiddenInput.addEventListener('input', function () {
      currentInputSpan.textContent = hiddenInput.value;
      cursorSpan.style.animationPlayState = hiddenInput.value.length > 0 ? 'paused' : 'running';
    });

    // Mobile tap hint
    if (navigator.maxTouchPoints > 0) {
      var hint = document.createElement('div');
      hint.className = 'tap-hint';
      hint.textContent = 'tap to type';
      promptDiv.parentNode.insertBefore(hint, promptDiv.nextSibling);
      terminal.addEventListener('click', function removehint() {
        hint.classList.add('hidden');
        setTimeout(function () { hint.parentNode && hint.parentNode.removeChild(hint); }, 400);
        terminal.removeEventListener('click', removehint);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();

