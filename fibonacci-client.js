var amqp = require("amqp"),
    uuid = require("node-uuid");


var FibonacciClient = function (callback) {
    this.connection = null;
    this.exchange = null;
    this.callback_queue = null;
    this.callbacks = {};
    this.init(callback);
};

FibonacciClient.prototype.init = function (callback) {
    this.readyCount = 0
    this.callback = callback;

    this.connection = amqp.createConnection({ url: 'amqp://example:example@127.0.0.1:5672' });
    // Wait for connection to become established.
    this.connection.on('ready', function () {
        if (this.readyCount === 0) {
            console.log('AMQP Connection made');
            this.readyCount++;

            //Create Exchange
            this.exchange = this.connection.exchange('fibonacci-exchange');

            //Create Callback queue.
            this.connection.queue('fibonacci-callback', {exclusive: true}, function (queue) {
                this.queue = queue;
                this.callback_queue = queue.name;

                //Bind callback queue to the exchange
                this.queue.bind('fibonacci-exchange', 'fibonacci-callback');

                //Subscribe to the callback queue
                this.queue.subscribe(this.onResponse.bind(this))
            }.bind(this));
        }
    }.bind(this));
};

FibonacciClient.prototype.onResponse = function (message, headers, deliveryInfo) {
    var corrId = deliveryInfo.correlationId;
    if (this.callbacks[corrId]) {
        this.callbacks[corrId](message.Value.toString());
        delete this.callbacks[corrId];
    }
};

FibonacciClient.prototype.call = function (n, callback) {
    //Create correlationId
    var corrId = uuid.v1();
    //Add callback to the map with the correlationId
    this.callbacks[corrId] = callback;

    //Publish request to the queue with the callback queue and correlationId
    console.log("Publish to queue")
    this.exchange.publish('fibonacci-queue', {n: parseInt(n)}, {replyTo: this.callback_queue, correlationId: corrId});
};

module.exports = FibonacciClient;