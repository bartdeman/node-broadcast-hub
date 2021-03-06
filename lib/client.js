var Client, redis,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

redis = require('redis');

Client = (function() {
  function Client(hub, id, socket) {
    this.hub = hub;
    this.id = id;
    this.socket = socket;
    this.onDisconnect = __bind(this.onDisconnect, this);
    this.onSubscribe = __bind(this.onSubscribe, this);
    this.onMessage = __bind(this.onMessage, this);
    this.redis = redis.createClient();
    this.redis.on('message', this.onMessage);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('hubSubscribe', this.onSubscribe);
  }

  Client.prototype.onMessage = function(channel, message) {
    return this.socket.emit('hubMessage', {
      channel: channel,
      message: message
    });
  };

  Client.prototype.onSubscribe = function(channel, cb) {
    var _this = this;
    return this.hub.canSubscribe(this, channel, function(err, allowed) {
      if (err) {
        return cb(err);
      }
      if (!allowed) {
        return cb('subscription refused');
      }
      return _this.redis.subscribe(channel, function(err) {
        if (!cb) {
          return;
        }
        return cb(err, channel);
      });
    });
  };

  Client.prototype.disconnect = function() {
    return this.socket.disconnect();
  };

  Client.prototype.onDisconnect = function() {
    this.hub.disconnect(this);
    return this.redis.quit();
  };

  return Client;

})();

module.exports = Client;
