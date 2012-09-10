var Backbone = require('backbone');
var Chemical = new require("organic").Chemical;
var Plasma = new require("organic").Plasma;
var plasma = new Plasma();
var MongoStore = require("../../membrane/MongoStore");
var _ = require('underscore');
require("backbone-callbacks").attach(Backbone);
require("../../utils/server/MongoBackbone").attach(Backbone, plasma);

describe("BackboneMongo", function(){
  var mongoStore = new MongoStore(plasma, {
    "dbname": "test-db2"
  });

  var Model;
  var model;
  it("define MongoModel", function(){
    Model = Backbone.MongoModel.extend({
      collectionName: "test"
    });
    expect(Model).toBeDefined();
  });
  it("create instance of MongoModel", function(){
    model = new Model();
    expect(model).toBeDefined();
  });
  it("save mongoModel instance", function(next){
    model.on("change", _.once(function(){
      expect(model.id).toBeDefined();
      next();
    }));
    model.save(null, {wait: true});
  });
  it("update mongoModel instance", function(next){
    model.on("change", _.once(function(){
      expect(model.get("title")).toBe("value");
      next();
    }));
    model.save({title: "value"}, {wait: true});
  });
  it("fetch mongoModel by id", function(next){
    var model2 = new Model({_id: model.id});
    model2.on("change", _.once(function(){
      expect(model2.get("title")).toBe("value");
      next();
    }));
    model2.fetch();
  });
  it("destroy mongoModel instance", function(next){
    model.on("destroy", _.once(function(){
      next();
    }));
    model.destroy();
  });

  var Collection;
  var collection;
  it("define MongoCollection", function(){
    Collection = Backbone.MongoCollection.extend({
      collectionName: "test",
      model: Model
    });
    expect(Collection).toBeDefined();
  });

  it("create MongoCollection instance", function(){
    collection = new Collection();
    expect(collection).toBeDefined();
  });

  it("creates new models to MongoCollection instance", function(next){
    collection.on("add", function(){
      expect(collection.length).toBe(1);
      expect(collection.at(0).id).toBeDefined();
      expect(collection.at(0).get("title")).toBe("value4");
      next();
    });
    collection.create({title: "value4"}, {wait: true});
  });

  it("finds models by pattern from mongoCollection instance", function(next){
    var collection2 = new Collection();
    collection2.on("reset", _.once(function(){
      expect(collection2.length).toBe(1);
      next();
    }));
    collection2.fetch({pattern: {title: "value4"}});
  });

  it("removes models from mongoCollection instance", function(next){
    collection.on("reset", _.once(function(){
      next();
    }));
    collection.on("destroy", _.once(function(){
      collection.fetch();
    }));
    collection.at(0).destroy();
  });

  it("kills MongoStore", function(){
    plasma.emit(new Chemical("kill"));
  });
});