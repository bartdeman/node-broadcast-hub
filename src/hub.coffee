redis = require 'redis'
socketIo = require 'socket.io'

Client = require './client'

class BroadcastHub
    constructor: (@server, @options = {}) ->
        # Clients are tracked in a hash, this gives us O(1) disconnects.
        @clients = {}
        @clientId = 0

        # Open a socket.io listener and listen for new clients.
        @io = socketIo.listen(@server, {
            'log level': 1
        })
        @io.set('authorization', @options.canConnect || false)
        @io.sockets.on 'connection', @onSocketConnect

    onSocketConnect: (socket) =>
        @clients[@clientId] = new Client(@, @clientId, socket)
        @clientId += 1

    disconnect: (client) ->
        delete @clients[client.id]

    disconnectAll: () ->
        client.disconnect() for id, client of @clients
        @clients = {}

    canSubscribe: (client, channel, cb) ->
        return cb(null, true) if !@options.canSubscribe
        @options.canSubscribe(client.socket.handshake, channel, cb)

    publish: (channel, message, cb) ->
        @publishClient = redis.createClient() if !@publishClient
        @publishClient.publish(channel, message, cb)

    # Counting clients is O(n), but that's okay, it's a diagnostic thing for
    # testing anyway.
    Object.defineProperty @prototype, 'clientCount',
        get: () ->
            clients = 0
            clients += 1 for key of @clients
            return clients

module.exports = BroadcastHub
