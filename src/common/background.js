function UstreamBouyomi() {
  var self = this;

  self.setup();

  kango.addMessageListener("bouyomi", function(event) {
    var text = event.data;
  });

  kango.addMessageListener("channelInfo", function(event) {
    var tab = event.data;
    tab.start();
  });

  kango.addMessageListener("register", function(event) {
    var data = {
      tabId: event.source.getId(),
      channel: event.data.channel
    };
    self.register(data);
  });

  kango.browser.addEventListener(kango.browser.event.BEFORE_NAVIGATE, function(event) {
    var data = {
      tabId: event.target.getId()
    };
    self.unregister(data);
  });

  kango.browser.addEventListener(kango.browser.event.TAB_REMOVED, function(event) {
    var data = {
      tabId: event.tabId
    };
    self.unregister(data);
  });
}

UstreamBouyomi.prototype = {

  _tabs: {},
  _options: {},

  setup: function() {
    this._options.host = kango.storage.getItem("host") || "127.0.0.1";
    this._options.port = kango.storage.getItem("port") || "50000";
    kango.storage.setItem("host", this._options.host);
    kango.storage.setItem("port", this._options.port);
    kango.console.log(this._options);
  },

  register: function(data) {
    data.options = this._options;
    var tab = new UstTab(data);
    this._tabs[data.tabId] = tab;
    tab.init();
  },

  unregister: function(data) {
    var tab = this._tabs[data.tabId];
    if (tab) {
      tab.stop();
      delete this._tabs[data.tabId];
    }
  }

};

UstTab.prototype = {

  _context: null,
  _channel: null,
  _channelInfo: null,
  _timestamp: null,
  _refreshInterval: null,

  _data_url: function() {
    return "http://api.ustream.tv/json/channel/" + this._context.channel + "/";
  },

  _api_url: function() {
    return "http://socialstream.ustream.tv/socialstream/get.json/" + this._channelInfo.id + "/";
  },

  init: function() {
    this.getChannelInfo();
  },

  getChannelInfo: function() {
    var self = this;
    var data = {
      method: "GET",
      url: this._data_url() + "getInfo",
      contentType: "json"
    };
    kango.xhr.send(data, function(data) {
      if (data.status == 200 && data.response != null) {
        self._channelInfo = data.response.results;
        kango.console.log(self._channelInfo);
        kango.dispatchMessage("channelInfo", self);
      }
    });
  },

  getTimeslice: function() {
    if (this._channelInfo == null) return;
    var self = this;
    var data, msg;
    if (this._timestamp == null) {
      data = {
        method: "GET",
        url: this._api_url() + "default",
        contentType: "json"
      };
    } else {
      data = {
        method: "GET",
        url: this._api_url() + "timeslice/" + this._timestamp + "/" + this._refreshInterval,
        contentType: "json"
      };
    }
    kango.xhr.send(data, function(data) {
      if (data.status == 200 && data.response != null) {
        kango.console.log(data.response);
        self.bouyomi(data.response);
        self.update(data.response);
      }
    });
  },

  start: function() {
    this.getTimeslice();
  },

  stop: function() {
    this._channelInfo = null;
  },

  update: function(timeslice) {
    var self = this;
    window.setTimeout(function() {
      self.getTimeslice();
    }, self._refreshInterval * 1000);
    this._timestamp = timeslice.range[1];
    this._refreshInterval = timeslice.refreshInterval;
  },

  bouyomi: function(timeslice) {
    if (timeslice.range[0] == 0) return;
    var i;
    for (i = 0; i < timeslice.payload.length; i++) {
      var msg = timeslice.payload[i];
      var text = msg.text;
      if (text) {
        var m = text.match(/(.+) \(live at.+/i);
        if (m) {
          text = m[1];
          kango.dispatchMessage("bouyomi", text);
          var options = this._context.options;
          var data = {
            method: "GET",
            url: "http://" + options.host + ":" + options.port + "/?t=" + text,
            contentType: "json"
          };
          kango.xhr.send(data, function(data) {
            if (data.status == 200 && data.response != null) {
              kango.console.log(data.response.results);
            }
          });
        }
      }
    }
  }

};

function UstTab(context) {
  var self = this;
  self._context = context;
  kango.console.log(self._context);
}

var extension = new UstreamBouyomi();
