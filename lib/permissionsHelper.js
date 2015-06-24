var async   = require("async");
var loglet  = require('loglet');


loglet = loglet.child({component: 'dao'});

var createPemissions = function(couchbase, dbs, msg, db_body, perms_prop_f, callback){

   var data = {
      _current : msg.object_data,
      _history : []
   }

   dbs[msg['bucket']].insert(msg.database, data, {}, function (err, result) {
      if (err) {
         loglet.error(err);
      }
      else {
         callback(null, { 'status': 'update' }, 200);
         if(msg['bucket']!== "app_permissions") {
            perms_prop_f.send({orig : msg, perms : data});
         }
      }
   });
}


var updateExistingPemissions = function(couchbase, dbs, msg, db_body, perms_prop_f, callback){

   if ( undefined !== db_body.value['_prev'] && null !== db_body.value['_prev']){
      db_body.value['_history'].push(db_body.value['_prev'])
   }

   db_body.value['_prev']    = db_body.value['_current']
   db_body.value['_current'] = msg.object_data


   dbs[msg['bucket']].replace(msg.database, db_body.value, {}, function (err, result) {
      if (err) {
         loglet.error(err);
      }
      else {
         callback(null, { 'status': 'update' }, 200);
         //push to seperate worker

         perms_prop_f.send({orig : msg, perms : db_body.value});
      }
   });
}

var createAppPemissions = function(couchbase, dbs, msg, callback){

   dbs[msg['bucket']].insert(msg.database, msg.object_data, {}, function (err, result) {
      if (err) {
         loglet.error(err);
      }
      else {
         callback(null, { 'status': 'update' }, 200);
      }
   });
}


var processPermissionsUpdate = function(couchbase, dbs, msg, perms_prop_f, callback){

   // get permissions
   dbs[msg['bucket']].get(msg.database, function (err, db_body) {

      if (err && 13 === err.code){
         loglet.info("Permissions do not exist");
         createPemissions(couchbase, dbs, msg, db_body, perms_prop_f, callback)
      }
      else{
         updateExistingPemissions(couchbase, dbs, msg, db_body, perms_prop_f, callback)
      }
   });

}

var processAppPermissionsUpdate = function(couchbase, dbs, msg, perms_prop_f, callback){

   createAppPemissions(couchbase, dbs, msg, callback)

}


module.exports.processPermissionsUpdate    = processPermissionsUpdate;
module.exports.processAppPermissionsUpdate = processAppPermissionsUpdate;