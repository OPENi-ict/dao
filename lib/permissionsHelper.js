var async   = require("async");
var loglet  = require('loglet');


loglet = loglet.child({component: 'dao'});


var comparePerms = function(a, b){

   //console.log("comparePerms ", a, b)

   if ( undefined === b && undefined !== a ){
      return false
   }

   for (i in a){
      if (a[i] !== b[i]){
         return false
      }
   }

   for (i in b){
      if (a[i] !== b[i]){
         return false
      }
   }

   return true
}


var getNewAndChangedTypes = function(perms, user_cloudlet, tp_cloudlet, tp_app_id){

   var updates          = []
   var permsTypes       = perms._current.perms['@types']
   var prevPermsTypes   = (undefined === perms._prev) ? {} : perms._prev.perms['@types']

   for (var i in permsTypes) {
      if (permsTypes[i]['@app_level'] && 0 !== Object.keys(permsTypes[i]['@app_level']).length) {
         if (undefined === prevPermsTypes[i] || !comparePerms(permsTypes[i]['@app_level'], prevPermsTypes[i]['@app_level'])) {
            var new_perms = permsTypes[i]['@app_level']
            updates.push(typeupdate(i, new_perms, false, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
         }
      }
      if (permsTypes[i]['@cloudlet_level'] && 0 !== Object.keys(permsTypes[i]['@cloudlet_level']).length) {
         if (undefined === prevPermsTypes[i] || !comparePerms(permsTypes[i]['@cloudlet_level'], prevPermsTypes[i]['@cloudlet_level'])) {
            updates.push(typeupdate(i, new_perms, true, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
         }
      }
   }

   return updates
}


var getRemovedTypes = function(perms, user_cloudlet, tp_cloudlet, tp_app_id){

   var updates          = []
   var permsTypes       = perms._current.perms['@types']
   var prevPermsTypes   = (undefined === perms._prev) ? {} : perms._prev.perms['@types']

   for (var i in prevPermsTypes) {

      if (prevPermsTypes[i]['@app_level'] && 0 !== Object.keys(prevPermsTypes[i]['@app_level']).length) {
         if (undefined === permsTypes[i]) {
            var new_perms = {}
            updates.push(typeupdate(i, new_perms, false, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
         }
      }
      if (prevPermsTypes[i]['@cloudlet_level'] && 0 !== Object.keys(prevPermsTypes[i]['@cloudlet_level']).length) {
         if (undefined === permsTypes[i]) {
            var new_perms = {}
            updates.push(typeupdate(i, new_perms, true, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
         }
      }
   }

   return updates
}


var getShadowSETypes = function(perms, other_updates, user_cloudlet, tp_cloudlet, tp_app_id){

   var updates          = []
   var permsSE          = perms._current.perms['@service_enabler']
   var prevPermsSE      = (undefined === perms._prev) ? {} : perms._prev.perms['@service_enabler']

   for (var i in permsSE){
      if (undefined !== prevPermsSE[i]){
         var se = permsSE[i]
         for (var j in other_updates){
            var tmp = JSON.parse(JSON.stringify(other_updates[j]))
            tmp.tp_cloudlet = se.cloudlet
            tmp.tp_app_id   = se.app_id
            updates.push(tmp)
         }
      }
   }

   return updates
}



var getNewSETypes = function(perms, user_cloudlet, tp_app_id){

   var updates          = []
   var permsTypes       = perms._current.perms['@types']
   var permsSE          = perms._current.perms['@service_enabler']
   var prevPermsSE      = (undefined === perms._prev) ? {} : perms._prev.perms['@service_enabler']

   for (var i in permsSE){
      if (undefined === prevPermsSE[i]){
         var se = permsSE[i]

         for (var i in permsTypes) {
            if (permsTypes[i]['@app_level'] && 0 !== Object.keys(permsTypes[i]['@app_level']).length) {
               var new_perms = permsTypes[i]['@app_level']
               updates.push(typeupdate(i, new_perms, false, user_cloudlet, se.cloudlet, se.app_id, tp_app_id))
            }
            if (permsTypes[i]['@cloudlet_level'] && 0 !== Object.keys(permsTypes[i]['@cloudlet_level']).length) {
               var new_perms = permsTypes[i]['@cloudlet_level']
               updates.push(typeupdate(i, new_perms, true, user_cloudlet, se.cloudlet, se.app_id, tp_app_id))
            }
         }
      }
   }

   return updates
}


var getDeletedSETypes = function(perms, user_cloudlet, tp_app_id){

   var updates          = []
   var prevPermsTypes   = (undefined === perms._prev) ? {} : perms._prev.perms['@types']
   var permsSE          = perms._current.perms['@service_enabler']
   var prevPermsSE      = (undefined === perms._prev) ? {} : perms._prev.perms['@service_enabler']

   for (var i in prevPermsSE){
      if (undefined === permsSE[i]){
         var se = prevPermsSE[i]

         for (var i in prevPermsTypes) {
            if (prevPermsTypes[i]['@app_level'] && 0 !== Object.keys(prevPermsTypes[i]['@app_level']).length) {
               var new_perms = {}
               updates.push(typeupdate(i, new_perms, false, user_cloudlet, se.cloudlet, se.app_id, tp_app_id))
            }
            if (prevPermsTypes[i]['@cloudlet_level'] && 0 !== Object.keys(prevPermsTypes[i]['@cloudlet_level']).length) {
               var new_perms = {}
               updates.push(typeupdate(i, new_perms, true, user_cloudlet, se.cloudlet, se.app_id, tp_app_id))
            }
         }
      }
   }

   return updates
}


var getNewAndUpdatedObjects = function(perms, user_cloudlet, tp_cloudlet, tp_app_id) {

   var updates = []

   var permsObjects     = perms._current.perms['@objects']
   var prevPermsObjects = (undefined === perms._prev) ? {} : perms._prev.perms['@objects']

   for (var i in permsObjects) {
      if (undefined === prevPermsObjects[i] || !comparePerms(permsObjects[i], prevPermsObjects[i])) {
         var new_perms = permsObjects[i]
         updates.push(objectupdate(i, new_perms, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
      }
   }

   return updates
}


var getRemovedObjects = function(perms, user_cloudlet, tp_cloudlet, tp_app_id) {

   var updates = []

   var permsObjects     = perms._current.perms['@objects']
   var prevPermsObjects = (undefined === perms._prev) ? {} : perms._prev.perms['@objects']

   for (var i in prevPermsObjects) {
      if (undefined === permsObjects[i]) {
         //needs more work to identify the default
         var new_perms = {}
         updates.push(objectupdate(i, new_perms, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
      }
   }

   return updates
}


var typeupdate = function (type_id, new_perms, is_global, user_cloudlet, tp_cloudlet, tp_app_id, created_by_app_id){

   return { type_id : type_id, new_perms : new_perms, is_global : is_global, user_cloudlet : user_cloudlet,
      tp_cloudlet : tp_cloudlet, tp_app_id : tp_app_id, created_by_app_id : created_by_app_id }

}

var objectupdate = function (object_id, new_perms, user_cloudlet, tp_cloudlet, tp_app_id, created_by_app_id){

   return { object_id : object_id, new_perms : new_perms, is_global :true, user_cloudlet : user_cloudlet,
      tp_cloudlet : tp_cloudlet, tp_app_id : tp_app_id, created_by_app_id : created_by_app_id }

}


var propagatePermissions = function(couchbase, dbs, msg, perms){

   var prevComplete         = (undefined !== perms._prev && perms._prev.status === 'propagated')
   var tag                  = perms._current._date_created

   var key                  = msg.database
   var cloudlet_id          = msg.cloudlet_id;
   var thirdPartyId         = msg.third_party;
   var third_party_cloudlet = msg.third_party_cloudlet

   var new_and_changed_types = getNewAndChangedTypes(perms, cloudlet_id, third_party_cloudlet, thirdPartyId)
   var removed_types         = getRemovedTypes(      perms, cloudlet_id, third_party_cloudlet, thirdPartyId)

   var combined = new_and_changed_types.concat(removed_types)

   var se_types   = getShadowSETypes( perms, combined,    cloudlet_id, third_party_cloudlet, thirdPartyId)
   var new_se     = getNewSETypes(    perms, cloudlet_id, thirdPartyId)
   var deleted_se = getDeletedSETypes(perms, cloudlet_id, thirdPartyId)

   var combined_types = [].concat.apply([], [combined, se_types, new_se, deleted_se])

   var new_objects     = getNewAndUpdatedObjects(perms, cloudlet_id, third_party_cloudlet, thirdPartyId)
   var removed_objects = getRemovedObjects(      perms, cloudlet_id, third_party_cloudlet, thirdPartyId)

   //var combined_objects = new_objects.concat(removed_objects)

   var funs = {}

   for ( var i = 0; i < removed_objects.length; i++ ){
      var permissions = removed_objects[i]
      funs['0'+i] = function(couchbase, dbs, permissions){
         return function (callback) {
            updateObjectsPermission(couchbase, dbs, permissions, callback)
         }
      }(couchbase, dbs, permissions)
   }

   for ( var i = 0; i < combined_types.length; i++ ){
      var permissions = combined_types[i]
      funs['1'+i] = function(couchbase, dbs, permissions){
         return function (callback) {
            updateObjectPermissionsByType(couchbase, dbs, permissions, callback)
         }
      }(couchbase, dbs, permissions)
   }

   for ( var i = 0; i < new_objects.length; i++ ){
      var permissions = new_objects[i]
      funs['2'+i] = function(couchbase, dbs, permissions){
         return function (callback) {
            updateObjectsPermission(couchbase, dbs, permissions, callback)
         }
      }(couchbase, dbs, permissions)
   }


   async.series(funs, function (err, results) {

      if (err) {
         loglet.error(err);
      }
      else{

         dbs['permissions'].get(msg.database, function (err, db_body) {

            if (err && 13 === err.code){
               loglet.info("Permissions do not exist: update failed");
            }
            else{
               if ( tag === db_body.value._current._date_created){
                  db_body.value._current.status = "propagated"
               }
               else if ( tag === db_body.value._prev._date_created){
                  db_body.value._prev.status = "propagated"
               }

               dbs['permissions'].replace(msg.database, db_body.value, function (err, result) {
                  //console.log("Permissions have been propogated");
                  loglet.info("Permissions have been propogated");
               })
            }
         });
      }
   });
}


var updateObjectPermissionsByType = function(couchbase, dbs, type_perm, callback){

   var skey = [type_perm.user_cloudlet, type_perm.type_id]
   var ekey = [type_perm.user_cloudlet, type_perm.type_id + "^"]


   var ViewQuery = couchbase.ViewQuery;
   var query = ViewQuery.from('objects_views', 'object_by_type')
      .stale(ViewQuery.Update.BEFORE)
      .range(skey, ekey, true)
      .reduce(false)


   dbs['objects'].query(query, function (err, res) {

      if (err){
         callback(err, null)
         return
      }

      var funs = {}

      for (var i = 0; i < res.length; i ++){

         var object_id      = res[i].value[1]
         var new_perm       = JSON.parse(JSON.stringify(type_perm))
         new_perm.object_id = object_id

         funs[i] = (function(couchbase, dbs, permissions){
            return function (callback) {
               updateObjectsPermission(couchbase, dbs, permissions, callback)
            }
         }(couchbase, dbs, new_perm))
      }

      async.series(funs, function (err, results) {

         if (err) {
            loglet.error(err);
            callback(err, null)
         }
         else{
            callback(null, "complete")
            //console.log(results)
         }
      });

   })
}


var updateObjectsPermission = function(couchbase, dbs, perms, callback){

   var key = perms.user_cloudlet + '+' + perms.object_id

   dbs['objects'].get(key, function (err, db_body) {

      if(err) {
         loglet.error(err);
         callback(null, "not found: " + key)
         return
      }

      if ( undefined === db_body.value._permissions ){
         db_body.value._permissions = {}
      }

      if ( perms.is_global || db_body.value._permissions.created_by_app === perms.created_by_app_id ){

         db_body.value._permissions[perms.tp_app_id]   = perms.new_perms
         db_body.value._permissions[perms.tp_cloudlet] = perms.new_perms

         dbs['objects'].replace(key, db_body.value, function (err, result) {

            //console.log("updateObjectsPermission > 3 " + key)
            if (err) {
               loglet.error(err);
               callback(null, "failure: " + key)
            }
            else {
               callback(null, "success: " + key)
            }
         });
      }
      else{
         callback(null, "success: " + key)
      }
   });
}


var createPemissions = function(couchbase, dbs, msg, callback){

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
            propagatePermissions(couchbase, dbs, msg, data)
         }
      }
   });
}


var updateExistingPemissions = function(couchbase, dbs, msg, db_body, callback){

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
         propagatePermissions(couchbase, dbs, msg, db_body.value)
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


var updateAppPemissions = function(couchbase, dbs, msg, db_body, callback){


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
         if(msg['bucket']!== "app_permissions") {
            propagatePermissions(couchbase, dbs, msg, db_body.value)
         }
      }
   });
}


var processPermissionsUpdate = function(couchbase, dbs, msg, callback){

   // get permissions
   dbs[msg['bucket']].get(msg.database, function (err, db_body) {

      if (err && 13 === err.code){
         loglet.info("Permissions do not exist");
         createPemissions(couchbase, dbs, msg, callback)
      }
      else{
         updateExistingPemissions(couchbase, dbs, msg, db_body, callback)
      }
   });

}

var processAppPermissionsUpdate = function(couchbase, dbs, msg, callback){

   createAppPemissions(couchbase, dbs, msg, callback)

}


module.exports.processPermissionsUpdate    = processPermissionsUpdate;
module.exports.processAppPermissionsUpdate = processAppPermissionsUpdate;