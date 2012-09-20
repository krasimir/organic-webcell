var root = "../../";

var dna = {
  "membrane": {
    "MongoStore": {
      "source": "membrane/MongoStore",
      "dbname": "organic-webdata-test",
      "addons": [
        "membrane/mongoStoreAddons/MongoSynapse", 
      ]
    },
    "WebSocketServer": {
      "source": "membrane/WebSocketServer",
      "port": 9061,
      "logLevel": 1,
      "addons": [
        "membrane/socketioAddons/SocketioServerSynapse"
      ]
    }
  },
  "plasma": {}
}


describe("SynapticBackbone", function(){

  var Backbone = require("backbone");
  require("backbone-callbacks").attach(Backbone);
  require(root+"lib/SynapticBackbone");
  require(root+"client/SocketioClientSynapse").attach(Backbone);
  require(root+"client/MemorySynapse").attach(Backbone);

  var WebCell = require(root+"WebCell");
  var _ = require("underscore");
  var io = require("socket.io-client");


  var cell;
  var secondConnection;
  var models = {};
  var instances = {};


  it("should have server started", function(next){
    cell = new WebCell(dna);
    cell.plasma.once("WebSocketServer", function(){
      next();
    });
  });

  it("should be able to connect as second user", function(next){
    secondConnection = io.connect("http://localhost:"+dna.membrane.WebSocketServer.port, {
      "force new connection": true
    });
    secondConnection.on("connect", function(){
      next();
    });
  });

  it("creates defines some models", function(){
    models.ClientModel = Backbone.Model.extend({
      url: "synapticTest",
      idAttribute: "_id"
    });
    models.ClientCollection = Backbone.Collection.extend({
      model: models.ClientModel
    });

    models.ServerModel = Backbone.Model.extend({
      url: "synapticTest",
      idAttribute: "_id"
    });
    models.ServerCollection = Backbone.Collection.extend({
      model: models.ServerModel
    });
  });

  it("creates synapses between server and client models", function(next){
    var count = 0;
    var tryNext = function(){
      count += 1;
      if(count == 2)
        next();
    }

    Backbone.addModelSynapse("mongo", models.ServerModel, Backbone.MongoSynapse);
    Backbone.addModelSynapse("socketio", models.ServerModel, Backbone.SocketioServerSynapse);
    Backbone.addCollectionSynapse("socketio", models.ServerCollection, Backbone.SocketioServerSynapse);

    models.ServerModel.socketio.listen(function(){
      models.ServerModel.mongo.connect();  
      tryNext();
    });
    
    // < -- socketio events -- >

    Backbone.addModelSynapse("socketio", models.ClientModel, Backbone.SocketioClientSynapse);
    Backbone.addModelSynapse("memory", models.ClientModel, Backbone.MemorySynapse);
    Backbone.addCollectionSynapse("socketio", models.ClientCollection, Backbone.SocketioServerSynapse);

    models.ClientModel.socketio.connect("http://localhost:"+dna.membrane.WebSocketServer.port, function(){
      models.ClientModel.memory.init();
      tryNext();
    });
  });

  it("creates new client model and server collection gets add event", function(next){
    var clientModel = instances.clientModel = new models.ClientModel();
    /*var serverCollection = instances.serverCollection = new models.ServerCollection();
    serverCollection.on("add", function(m){
      expect(m.id).toBeDefined();
      expect(m.get("title")).toBe("add me please");
    });
    clientModel.save({title: "add me please"});*/
  });

  it("should kill the cell", function(){
    models.ClientModel.socketio.disconnect();
    secondConnection.disconnect();
    cell.kill();
  });
});