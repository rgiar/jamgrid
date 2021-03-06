(function() {
  var ChatView, Client, ErrorView, HTML5Player, Instrument, Jam, JamView, LoadingView, ModalView, PartView, PercussionInstrument, PitchedInstrument, Player, SoundManagerPlayer, _i, _results;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  window.scales = {
    "Major Pentatonic": [0, 2, 4, 7, 9],
    "Minor Pentatonic": [0, 3, 5, 7, 10],
    "Chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  };
  Instrument = (function() {
    function Instrument(key, name) {
      this.key = key;
      this.name = name;
    }
    Instrument.prototype.filename = function(soundKey, format) {
      this.soundKey = soundKey;
      this.format = format;
      return "/instruments/" + this.key + "/" + this.soundKey + "." + this.format;
    };
    return Instrument;
  })();
  PitchedInstrument = (function() {
    __extends(PitchedInstrument, Instrument);
    function PitchedInstrument(key, name, notes) {
      this.key = key;
      this.name = name;
      this.notes = notes;
    }
    PitchedInstrument.prototype.soundsForScale = function(scale) {
      var note, _i, _len, _ref, _ref2, _results;
      _ref = this.notes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        note = _ref[_i];
        if (_ref2 = note % 12, __indexOf.call(scale, _ref2) >= 0) {
          _results.push(note);
        }
      }
      return _results;
    };
    return PitchedInstrument;
  })();
  PercussionInstrument = (function() {
    __extends(PercussionInstrument, Instrument);
    function PercussionInstrument(key, name, sounds) {
      this.key = key;
      this.name = name;
      this.sounds = sounds;
    }
    PercussionInstrument.prototype.iconFilename = function(soundKey) {
      this.soundKey = soundKey;
      return "/instruments/" + this.key + "/" + this.soundKey + ".png";
    };
    PercussionInstrument.prototype.soundsForScale = function(scale) {
      return this.sounds;
    };
    return PercussionInstrument;
  })();
  window.instruments = {
    epiano: new PitchedInstrument("epiano", "E-Piano", (function() {
      _results = [];
      for (_i = 28; _i <= 63; _i++){ _results.push(_i); }
      return _results;
    }).apply(this, arguments)),
    808: new PercussionInstrument("808", "808", ['bass', 'closedhat', 'openhat', 'snare', 'cymbal', 'clap', 'cowbell'])
  };
  Jam = (function() {
    __extends(Jam, Backbone.Model);
    function Jam() {
      Jam.__super__.constructor.apply(this, arguments);
    }
    Jam.prototype.setPart = function(instrumentKey, part, fromServer) {
      var parts;
      if (fromServer == null) {
        fromServer = false;
      }
      parts = _.clone(this.get("parts"));
      parts[instrumentKey] = part;
      this.set({
        parts: parts
      });
      if (!fromServer) {
        return this.trigger("userchangedpart", instrumentKey, part);
      }
    };
    Jam.prototype.getPart = function(instrumentKey) {
      return this.get("parts")[instrumentKey] || [];
    };
    return Jam;
  })();
  ModalView = (function() {
    __extends(ModalView, Backbone.View);
    function ModalView() {
      ModalView.__super__.constructor.apply(this, arguments);
    }
    ModalView.prototype.initialize = function() {
      return this.render();
    };
    ModalView.prototype.render = function() {
      this.curtainEl = $('<div />').addClass('modalCurtain');
      this.el = $('<div />').addClass('modalContainer');
      this.renderContent();
      $(document.body).append(this.el);
      return $(document.body).append(this.curtainEl);
    };
    ModalView.prototype.remove = function() {
      ModalView.__super__.remove.apply(this, arguments);
      return this.curtainEl.remove();
    };
    return ModalView;
  })();
  ErrorView = (function() {
    __extends(ErrorView, ModalView);
    function ErrorView() {
      ErrorView.__super__.constructor.apply(this, arguments);
    }
    ErrorView.prototype.initialize = function(error) {
      this.error = error;
      ErrorView.__super__.initialize.apply(this, arguments);
      return this.el.addClass('error');
    };
    ErrorView.prototype.renderContent = function() {
      this.el.append($('<h2 />').html('Bad News :('));
      return this.el.append($('<p />').html(this.error));
    };
    return ErrorView;
  })();
  LoadingView = (function() {
    __extends(LoadingView, ModalView);
    function LoadingView() {
      LoadingView.__super__.constructor.apply(this, arguments);
    }
    LoadingView.prototype.initialize = function() {
      LoadingView.__super__.initialize.apply(this, arguments);
      this.say("Reticulating splines");
      window.client.bind('connecting', __bind(function() {
        return this.say("Connecting to server");
      }, this));
      window.client.bind('connected', __bind(function() {
        return this.say("Joining jam");
      }, this));
      window.client.bind('jamloaded', __bind(function() {
        return this.say("Loading samples");
      }, this));
      window.player.bind('sampleloaded', __bind(function() {
        return this.say("Loading samples (" + window.player.numSamplesLoading() + " remain)");
      }, this));
      return window.player.bind('ready', __bind(function() {
        return this.remove();
      }, this));
    };
    LoadingView.prototype.say = function(message) {
      return this.$('P').html(message);
    };
    LoadingView.prototype.renderContent = function() {
      this.el.append($('<h2 />').html('Prepare to Jam'));
      return this.messageEl = this.el.append('<p />');
    };
    return LoadingView;
  })();
  JamView = (function() {
    __extends(JamView, Backbone.View);
    function JamView() {
      JamView.__super__.constructor.apply(this, arguments);
    }
    JamView.prototype.initialize = function() {
      return _.defer(__bind(function() {
        this.render();
        window.player.bind('playing', __bind(function() {
          this.$('.playButton').hide();
          return this.$('.stopButton').show();
        }, this));
        window.player.bind('stopping', __bind(function() {
          this.$('.playButton').show();
          return this.$('.stopButton').hide();
        }, this));
        this.editPart("epiano");
        return this.chatView = new ChatView({
          el: this.$('.chat')
        });
      }, this));
    };
    JamView.prototype.events = {
      "click .playButton": "play",
      "click .stopButton": "stop",
      "click .instruments li": "editPart"
    };
    JamView.prototype.editPart = function(instrumentKey) {
      if (instrumentKey.target != null) {
        instrumentKey = $(instrumentKey.target).data('key');
      }
      this.trigger('editing', instrumentKey);
      this.editingInstrument = instrumentKey;
      this.partView = new PartView({
        jam: this.model,
        instrumentKey: instrumentKey,
        el: this.$('.part')
      });
      this.$('.instruments li').removeClass('current');
      return this.$('.instruments li[data-key=' + instrumentKey + ']').addClass('current');
    };
    JamView.prototype.play = function() {
      return window.player.play();
    };
    JamView.prototype.stop = function() {
      return window.player.stop();
    };
    JamView.prototype.render = function() {
      var bar, editor, instrument, instruments, key, _ref;
      instruments = $('<ul />').addClass('instruments');
      _ref = window.instruments;
      for (key in _ref) {
        instrument = _ref[key];
        instruments.append($('<li />').html(instrument.name).attr('data-key', instrument.key));
      }
      editor = $('<div />').addClass('editor').html(instruments);
      editor.append($('<div />').addClass('part'));
      bar = $('<div />').addClass('controls');
      bar.append($('<button />').html('Play').addClass('playButton'));
      bar.append($('<button />').html('Stop').addClass('stopButton').hide());
      return $(this.el).html(bar).append(editor).append($('<div />').addClass('chat'));
    };
    return JamView;
  })();
  ChatView = (function() {
    __extends(ChatView, Backbone.View);
    function ChatView() {
      ChatView.__super__.constructor.apply(this, arguments);
    }
    ChatView.prototype.initialize = function() {
      return this.render();
    };
    ChatView.prototype.render = function() {
      return $(this.el).html($('<div />').addClass('received'));
    };
    return ChatView;
  })();
  PartView = (function() {
    __extends(PartView, Backbone.View);
    function PartView() {
      PartView.__super__.constructor.apply(this, arguments);
    }
    PartView.prototype.initialize = function() {
      var _j, _ref, _results2;
      this.jam = this.options.jam;
      this.instrument = window.instruments[this.options.instrumentKey];
      this.scale = window.scales[this.jam.get("scale")];
      this.beats = (function() {
        _results2 = [];
        for (var _j = 0, _ref = this.jam.get('patternLength') - 1; 0 <= _ref ? _j <= _ref : _j >= _ref; 0 <= _ref ? _j++ : _j--){ _results2.push(_j); }
        return _results2;
      }).apply(this, arguments);
      this.sounds = this.instrument.soundsForScale(this.scale);
      this.render();
      window.player.bind('beat', __bind(function(num) {
        return this.setCurrentBeat(num);
      }, this));
      window.player.bind('stopping', __bind(function() {
        return this.setCurrentBeat(null);
      }, this));
      this.jam.bind('change:parts', __bind(function() {
        return this.populateFromJam();
      }, this));
      return this.populateFromJam();
    };
    PartView.prototype.events = {
      "click TD.toggleable": "toggleCell",
      "click .clearButton": "resetPattern"
    };
    PartView.prototype.render = function() {
      var beat, container, label, row, sound, table, _j, _k, _len, _len2, _ref, _ref2;
      table = $('<table />');
      _ref = this.sounds;
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        sound = _ref[_j];
        row = $('<tr />');
        if (this.instrument.iconFilename != null) {
          label = $('<img />').attr('src', this.instrument.iconFilename(sound));
        } else {
          label = '';
        }
        row.append($('<td />').html(label).addClass('label'));
        _ref2 = this.beats;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          beat = _ref2[_k];
          row.append($('<td />').attr('data-beat', beat).attr('data-sound', sound).addClass('toggleable'));
        }
        table.prepend(row);
      }
      container = $('<div />');
      container.append($('<h3 />').html('Edit ' + this.instrument.name));
      container.append(table);
      container.append($('<button />').html('Clear').addClass('clearButton'));
      return $(this.el).html(container);
    };
    PartView.prototype.populateFromJam = function() {
      return this.setCells(this.jam.getPart(this.options.instrumentKey));
    };
    PartView.prototype.toggleCell = function(event) {
      $(event.target).toggleClass('on');
      return this.updateModel();
    };
    PartView.prototype.resetPattern = function() {
      this.clearCells();
      return this.updateModel();
    };
    PartView.prototype.findCell = function(beat, sound) {
      return this.$("td[data-beat=" + beat + "][data-sound=" + sound + "]");
    };
    PartView.prototype.clearCells = function() {
      return this.$("td").removeClass('on');
    };
    PartView.prototype.setCells = function(part) {
      var beatNum, sound, sounds, _len, _results2;
      this.clearCells();
      _results2 = [];
      for (beatNum = 0, _len = part.length; beatNum < _len; beatNum++) {
        sounds = part[beatNum];
        _results2.push((function() {
          var _j, _len2, _results3;
          _results3 = [];
          for (_j = 0, _len2 = sounds.length; _j < _len2; _j++) {
            sound = sounds[_j];
            _results3.push(this.findCell(beatNum, sound).addClass('on'));
          }
          return _results3;
        }).call(this));
      }
      return _results2;
    };
    PartView.prototype.setCurrentBeat = function(beat) {
      this.$("td").removeClass('current');
      if (beat != null) {
        return this.$("td[data-beat=" + beat + "]").addClass('current');
      }
    };
    PartView.prototype.updateModel = function() {
      var cell, n, part, _j, _len, _ref;
      part = (function() {
        var _ref, _results2;
        _results2 = [];
        for (n = 1, _ref = this.jam.get('patternLength'); 1 <= _ref ? n <= _ref : n >= _ref; 1 <= _ref ? n++ : n--) {
          _results2.push([]);
        }
        return _results2;
      }).call(this);
      _ref = this.$("td.on");
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        cell = _ref[_j];
        cell = $(cell);
        part[cell.data('beat')].push(cell.data('sound'));
      }
      return this.jam.setPart(this.options.instrumentKey, part);
    };
    return PartView;
  })();
  Client = (function() {
    function Client() {
      _.extend(this, Backbone.Events);
      this.jamid = _.last(document.location.pathname.split("/"));
      this.sessionid = $.cookie('connect.sid');
      console.log("Trying to connect");
      this.trigger('connecting');
      this.socket = io.connect();
      this.socket.on('welcome', __bind(function() {
        this.trigger('connected');
        console.log("We were welcomed");
        return this.socket.emit('identify', this.sessionid, this.jamid);
      }, this));
      this.socket.on('initjam', __bind(function(jamdata) {
        var view;
        if (this.jam != null) {
          return;
        }
        this.trigger('jamloaded');
        this.jam = new Jam(jamdata);
        window.player.loadJam(this.jam);
        view = new JamView({
          model: this.jam,
          el: $('#jam')[0]
        });
        this.jam.bind('userchangedpart', __bind(function(instKey, data) {
          return this.socket.emit('writepart', instKey, data);
        }, this));
        return view.bind('editing', __bind(function(instKey) {
          return this.socket.emit('editing', instKey);
        }, this));
      }, this));
      this.socket.on('partchange', __bind(function(instKey, data) {
        return this.jam.setPart(instKey, data, true);
      }, this));
      this.socket.on('editing', __bind(function(login, instKey) {
        return console.log(login + " is now editing " + instKey);
      }, this));
    }
    return Client;
  })();
  Player = (function() {
    Player.prototype.format = "wav";
    Player.prototype.tickInterval = 5;
    function Player() {
      _.extend(this, Backbone.Events);
      this.state = "unprepared";
      console.log("Player feels woefully unprepared");
    }
    Player.prototype.loadJam = function(jam) {
      this.beatInterval = 1000 / (jam.get('speed') / 60);
      this.patternLength = jam.get('patternLength');
      this.scale = window.scales[jam.get('scale')];
      this.parts = jam.get('parts');
      jam.bind("change:parts", __bind(function() {
        return this.parts = jam.get("parts");
      }, this));
      console.log("Player loaded jam");
      return this.prepare();
    };
    Player.prototype.beginPattern = function() {
      console.log("Player beginning pattern");
      return this.patternPos = 0;
    };
    Player.prototype.tick = function() {
      var time;
      time = (new Date).getTime();
      if (time - this.lastBeat >= this.beatInterval) {
        this.lastBeat = time;
        return this.beat();
      }
    };
    Player.prototype.beat = function() {
      var instrument, instrumentKey, part, sound, _j, _len, _ref, _ref2;
      console.log("Player: beat! pos = " + this.patternPos);
      if (this.patternPos === this.patternLength) {
        this.beginPattern();
      }
      _ref = this.parts;
      for (instrumentKey in _ref) {
        part = _ref[instrumentKey];
        instrument = window.instruments[instrumentKey];
        _ref2 = part[this.patternPos];
        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
          sound = _ref2[_j];
          this.playSound(instrument, sound);
        }
      }
      this.trigger('beat', this.patternPos);
      return this.patternPos += 1;
    };
    Player.prototype.play = function() {
      if (this.state !== "ready") {
        console.log("Player isn't ready to play");
        return;
      }
      this.state = "playing";
      this.trigger("playing");
      console.log("Player playing");
      this.beginPattern();
      this.lastBeat = 0;
      return this.tickIntervalID = setInterval(__bind(function() {
        return this.tick();
      }, this), this.tickInterval);
    };
    Player.prototype.stop = function() {
      if (this.state !== "playing") {
        console.log("Player can't stop - it isn't playing");
        return;
      }
      this.state = "ready";
      this.trigger('stopping');
      return clearInterval(this.tickIntervalID);
    };
    return Player;
  })();
  HTML5Player = (function() {
    __extends(HTML5Player, Player);
    HTML5Player.prototype.samplePolyphony = 2;
    function HTML5Player() {
      HTML5Player.__super__.constructor.apply(this, arguments);
      this.samples = {};
    }
    HTML5Player.prototype.prepare = function() {
      var audioEl, filename, instrument, key, num, sound, _j, _len, _ref, _ref2;
      _ref = window.instruments;
      for (key in _ref) {
        instrument = _ref[key];
        _ref2 = instrument.soundsForScale(this.scale);
        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
          sound = _ref2[_j];
          filename = instrument.filename(sound, this.format);
          this.samples[filename] = (function() {
            var _ref3, _results2;
            _results2 = [];
            for (num = 1, _ref3 = this.samplePolyphony; 1 <= _ref3 ? num <= _ref3 : num >= _ref3; 1 <= _ref3 ? num++ : num--) {
              audioEl = $('<audio />').attr('src', filename).data({
                state: 'loading',
                n: num
              });
              audioEl.bind('canplaythrough', __bind(function(ev) {
                var sample;
                sample = $(ev.target);
                sample.data('state', 'ready').unbind();
                this.trigger('sampleloaded');
                console.log("Player loaded " + ev.target.src + "!");
                sample.bind('ended', function(ev) {
                  return $(ev.target).data('state', 'ready');
                });
                if (this.numSamplesLoading() === 0) {
                  this.state = 'ready';
                  this.trigger('ready');
                  return console.log("Player ready");
                }
              }, this));
              console.log("Player loading " + filename);
              _results2.push(audioEl[0]);
            }
            return _results2;
          }).call(this);
        }
      }
      return this.state = "preparing";
    };
    HTML5Player.prototype.numSamplesLoading = function() {
      var el;
      return ((function() {
        var _j, _len, _ref, _results2;
        _ref = _.flatten(this.samples);
        _results2 = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          el = _ref[_j];
          if ($(el).data('state') === 'loading') {
            _results2.push(1);
          }
        }
        return _results2;
      }).call(this)).length;
    };
    HTML5Player.prototype.readyElementForSample = function(filename) {
      var el, _j, _len, _ref;
      _ref = this.samples[filename];
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        el = _ref[_j];
        if ($(el).data('state') === 'ready') {
          return el;
        }
      }
      console.log("Player sample elements exhausted for " + filename);
      return null;
    };
    HTML5Player.prototype.playSound = function(instrument, sound) {
      var needsPlaying, sample;
      if (sample = this.readyElementForSample(instrument.filename(sound, this.format))) {
        $(sample).data('state', 'playing');
        needsPlaying = sample.currentTime === 0;
        sample.currentTime = 0;
        if (needsPlaying) {
          return sample.play();
        }
      }
    };
    return HTML5Player;
  })();
  SoundManagerPlayer = (function() {
    __extends(SoundManagerPlayer, Player);
    SoundManagerPlayer.prototype.format = "mp3";
    function SoundManagerPlayer() {
      SoundManagerPlayer.__super__.constructor.apply(this, arguments);
      this.sm = window.soundManager;
      this.samplesLoading = 0;
    }
    SoundManagerPlayer.prototype.prepare = function(callback) {
      this.state = "preparing";
      this.sm.ontimeout(function() {
        this.state = "broken";
        return new ErrorView("Your platform requires Flash to play audio reliably, but Flash failed to load. Please disable any Flash blocker and reload the page.");
      });
      return this.sm.onready(__bind(function() {
        var filename, instrument, key, sound, _ref, _results2;
        console.log("sm is ready");
        _ref = window.instruments;
        _results2 = [];
        for (key in _ref) {
          instrument = _ref[key];
          _results2.push((function() {
            var _j, _len, _ref2, _results3;
            _ref2 = instrument.soundsForScale(this.scale);
            _results3 = [];
            for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
              sound = _ref2[_j];
              filename = instrument.filename(sound, this.format);
              this.samplesLoading += 1;
              _results3.push(this.sm.createSound({
                id: filename,
                url: filename,
                autoLoad: true,
                autoPlay: false,
                volume: 50,
                onload: __bind(function() {
                  this.samplesLoading -= 1;
                  console.log("SM loaded " + filename + "!");
                  this.trigger('sampleloaded');
                  if (this.samplesLoading === 0) {
                    this.state = 'ready';
                    this.trigger('ready');
                    return console.log("Player ready");
                  }
                }, this)
              }));
            }
            return _results3;
          }).call(this));
        }
        return _results2;
      }, this));
    };
    SoundManagerPlayer.prototype.numSamplesLoading = function() {
      return this.samplesLoading;
    };
    SoundManagerPlayer.prototype.playSound = function(instrument, sound) {
      return this.sm.play(instrument.filename(sound, this.format));
    };
    return SoundManagerPlayer;
  })();
  if (window.soundManager != null) {
    window.soundManager.url = '/swf/';
  }
  window.soundManager.flashVersion = 9;
  window.soundManager.useHighPerformance = true;
  window.soundManager.useConsole = false;
  window.soundManager.debugMode = false;
  $(function() {
    if (!(window.console != null)) {
      window.console = {
        log: function() {}
      };
    }
    console.log("Initializing");
    window.player = new SoundManagerPlayer;
    window.client = new Client;
    return new LoadingView;
  });
}).call(this);
