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





var isFirst = function(perms){

   if (undefined === perms._prev){
      return true
   }
   else if(0 === Object.keys(perms._prev.perms['@objects']).length
      && 0   === Object.keys(perms._prev.perms['@types']).length
      && 0   === Object.keys(perms._prev.perms['@service_enabler']).length){
      return true;
   }
   return false;

}

var getNewAndChangedTypes = function(perms, user_cloudlet, tp_cloudlet, tp_app_id){

   var updates          = []
   var permsTypes       = perms._current.perms['@types']
   var prevPermsTypes   = (undefined === perms._prev) ? {} : perms._prev.perms['@types']

   console.log("permsTypes",     JSON.stringify(permsTypes, null, 2))
   console.log("prevPermsTypes", JSON.stringify(prevPermsTypes, null, 2))

   for (var i in permsTypes) {
      if (permsTypes[i]['@app_level']) {

         if (undefined === prevPermsTypes[i] || !comparePerms(permsTypes[i]['@app_level'], prevPermsTypes[i]['@app_level'])) {
            var new_perms = permsTypes[i]['@app_level']
            updates.push(typeupdate(i, new_perms, false, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
         }
      }
      if (permsTypes[i]['@cloudlet_level']) {
         if (undefined === prevPermsTypes[i] || !comparePerms(permsTypes[i]['@cloudlet_level'], prevPermsTypes[i]['@cloudlet_level'])) {
            updates.push(typeupdate(i, new_perms, true, user_cloudlet, tp_cloudlet, tp_app_id, tp_app_id))
         }
      }
   }

   console.log(JSON.stringify(updates, null, 2))

   return updates
}


var typeupdate = function (type_id, new_perms, is_global, user_cloudlet, tp_cloudlet, tp_app_id, created_by_app_id){

   return { type_id : type_id, new_perms : new_perms, is_global : is_global, user_cloudlet : user_cloudlet,
      tp_cloudlet : tp_cloudlet, tp_app_id : tp_app_id, created_by_app_id : created_by_app_id }

}

var objectupdate = function (object_id, new_perms, user_cloudlet, tp_cloudlet, tp_app_id, created_by_app_id){

   return { object_id : object_id, new_perms : new_perms, user_cloudlet : user_cloudlet,
      tp_cloudlet : tp_cloudlet, tp_app_id : tp_app_id, created_by_app_id : created_by_app_id }

}


var propagatePermissions = function(couchbase, dbs, msg, perms){

   console.log("propogate ", msg)
   //console.log("propogate ", perms)

   var prevComplete         = (undefined !== perms._prev && perms._prev.status === 'propagated')
   var tag                  = perms._current._date_created


   var cloudlet_id          = msg.cloudlet_id;
   var thirdPartyId         = msg.third_party;
   var third_party_cloudlet = msg.third_party_cloudlet


   var new_and_changed_types = getNewAndChangedTypes(perms, cloudlet_id, third_party_cloudlet, thirdPartyId)


   return

   var permsObjects     = perms._current.perms['@objects']
   var permsTypes       = perms._current.perms['@types']
   var permsSE          = perms._current.perms['@service_enabler']

   var prevPermsObjects = (undefined === perms._prev) ? {} : perms._prev.perms['@objects']
   var prevPermsTypes   = (undefined === perms._prev) ? {} : perms._prev.perms['@types']
   var prevPermsSE      = (undefined === perms._prev) ? {} : perms._prev.perms['@service_enabler']


   var isfirst = isFirst(perms)

   //console.log("permsTypes " + permsTypes)

   //can be shadow for the first time added
   for (var i in permsSE){
      if (isfirst){
         se_shadow.push(permsSE[i])
      }
      else if (undefined === prevPermsSE[i]){
         se_added.push(permsSE[i])
      }
      else{
         se_shadow.push(permsSE[i])
      }
   }


   for (var i in prevPermsSE){
      if (undefined === permsSE[i]){
         se_removed.push(prevPermsSE[i])
      }
   }

   var se_type_updates_app = {}
   var se_type_updates_all = {}
   var se_added_objects    = []


   console.log("permsTypes     ", JSON.stringify(permsTypes,     null, 2))
   console.log("prevPermsTypes ", JSON.stringify(prevPermsTypes, null, 2))

   for (var i in permsTypes){

      //console.log("-1-1> " + prevComplete)
      if ( prevComplete ){
         if (permsTypes[i]['@app_level']){
            //console.log("000>")
            if ( undefined === prevPermsTypes[i] ||  !comparePerms(permsTypes[i]['@app_level'], prevPermsTypes[i]['@app_level']) ){
               type_updates_app[i] = permsTypes[i]['@app_level']
               console.log(">>> a 1")
            }
         }
         if (permsTypes[i]['@cloudlet_level'] && 0 !== Object.keys(permsTypes[i]['@cloudlet_level']).length){
            if ( undefined === prevPermsTypes[i] || !comparePerms(permsTypes[i]['@cloudlet_level'], prevPermsTypes[i]['@cloudlet_level']) ){
               type_updates_all[i] = permsTypes[i]['@cloudlet_level']
               console.log(">>> a 2")
            }
         }
      }
      else{
         type_updates_app[i] = permsTypes[i]['@app_level']
         console.log(">>> a 3")
         type_updates_all[i] = permsTypes[i]['@cloudlet_level']
         console.log(">>> a 4")
      }

      for (var j = 0; j < se_added.length; j++){
         var id = se_added[j].app_id
         if (0 !== Object.keys(permsTypes[i]['@app_level']).length) {
            if (undefined === se_type_updates_app[id]){
               se_type_updates_app[id] = {}
            }
            se_type_updates_app[id][i] = permsTypes[i]['@app_level']
         }
         if (0 !== Object.keys(permsTypes[i]['@cloudlet_level']).length){
            if (undefined === se_type_updates_all[id]){
               se_type_updates_all[id] = {}
            }
            se_type_updates_all[id][i] = permsTypes[i]['@cloudlet_level']
         }
      }
   }

   var tmp = prevPermsTypes
   prevPermsTypes = permsTypes
   permsTypes     = tmp

   for (var i in permsTypes){

      for (var j = 0; j < se_removed.length; j++){

         console.log("se_type_updates_app[se_removed[j].app_id]", se_removed[j].app_id)

         if (undefined === se_type_updates_app[se_removed[j].app_id]){
            se_type_updates_app[se_removed[j].app_id] = {}
         }

         se_type_updates_app[se_removed[j].app_id]    = {}
         se_type_updates_app[se_removed[j].app_id][i] = {}
         se_type_updates_app[se_removed[j].cloudlet]    = {}
         se_type_updates_app[se_removed[j].cloudlet][i] = {}

         console.log("llllllll>>>>>> ", permsTypes[i]['@cloudlet_level'])

      }


      console.log("se_type_updates_app", se_type_updates_app)


      if (undefined !== prevPermsTypes[i]){
         continue
      }

      //console.log("-1-1> " + prevComplete)
      if ( prevComplete ){
         if (permsTypes[i]['@app_level']){
            //console.log("000>")
            if ( undefined === prevPermsTypes[i] ||  !comparePerms(permsTypes[i]['@app_level'], prevPermsTypes[i]['@app_level']) ){
               type_updates_app[i] = {}
               console.log(">>> b 1")
               console.log(">>> b 1 i", i)
               console.log(">>> b 1 i", permsTypes[i])
               console.log(">>> b 1 permsTypes[i]['@app_level'] ",     permsTypes[i]['@app_level'])
               console.log(">>> b 1 prevPermsTypes[i] ",               prevPermsTypes[i])
               console.log(">>> b 1 permsTypes[i]['@app_level'] ",     permsTypes[i]['@app_level'])
               if (prevPermsTypes[i]) {
                  console.log(">>> b 1 prevPermsTypes[i]['@app_level'] ", prevPermsTypes[i]['@app_level'])
                  console.log(">>> b 1 prevPermsTypes[i] ", comparePerms(permsTypes[i]['@app_level'], prevPermsTypes[i]['@app_level']))
               }
            }
         }
         //checks that previous permsTypes[i]['@cloudlet_level'] wasn't an empty object as it can be

         console.log("Object.keys(permsTypes[i]['@cloudlet_level']).length", Object.keys(permsTypes[i]['@cloudlet_level']).length)

         if (permsTypes[i]['@cloudlet_level'] && 0 !== Object.keys(permsTypes[i]['@cloudlet_level']).length){
            if ( undefined === prevPermsTypes[i] || !comparePerms(permsTypes[i]['@cloudlet_level'], prevPermsTypes[i]['@cloudlet_level']) ) {
               type_updates_all[i] = {}
               console.log(">>> b 2")
               console.log(">>> b 2 i", i)
               console.log(">>> b 2 i", permsTypes[i])
               console.log(">>> b 2 permsTypes[i]['@cloudlet_level'] ", permsTypes[i]['@cloudlet_level'])
               console.log(">>> b 2 prevPermsTypes[i] ", prevPermsTypes[i])
               console.log(">>> b 2 permsTypes[i]['@cloudlet_level'] ", permsTypes[i]['@cloudlet_level'])
               if (prevPermsTypes[i]) {
                  console.log(">>> b 2 prevPermsTypes[i]['@cloudlet_level'] ", prevPermsTypes[i]['@cloudlet_level'])
                  console.log(">>> b 2 prevPermsTypes[i] ", comparePerms(permsTypes[i]['@cloudlet_level'], prevPermsTypes[i]['@cloudlet_level']))
               }
            }
         }
      }
      else{
         if ( undefined === type_updates_app[i]){
            type_updates_app[i] = {}
            console.log(">>> b 3")
         }
         if ( undefined === type_updates_all[i]){
            type_updates_all[i] = {}
            console.log(">>> b 4")
         }
      }

      console.log("se_added", se_added)
   }


   for (var i in permsObjects){
      if ( !prevComplete || !comparePerms(permsObjects[i], prevPermsObjects[i]) ){
         object_updates[i] = permsObjects[i]
         objects.push(i)
      }
   }


   //console.log("type_updates_app ", type_updates_app)
   //console.log("type_updates_all ", type_updates_all)
   //console.log("object_updates   ", object_updates)


   console.log("SSS se_added ", se_added)
   //handle newly added SERVICE ENABLER
   for (var i = 0; i < se_added.length; i++){
      var shad = se_added[i]
      var id   = shad.app_id
      var cid  = shad.cloudlet

      console.log("SSS se_added ", shad)

      for ( var type_id in se_type_updates_all[shad.app_id] ){

         var permissions = {}
         permissions[id]  = se_type_updates_all[id][type_id]
         permissions[cid] = se_type_updates_all[id][type_id]

         console.log(">>>> Z", permissions)

         updateObjectPermissionsByType(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, false)
      }

      for ( var type_id in se_type_updates_app[shad.app_id] ){
         console.log("SSS se_added ", type_id)

         var permissions = {}
         permissions[id]  = se_type_updates_app[id][type_id]
         permissions[cid] = se_type_updates_app[id][type_id]

         console.log(">>>> X", permissions)

         updateObjectPermissionsByType(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, true)
      }
   }


   console.log("SSS se_removed ", se_removed)
   //handle removed SERVICE ENABLER
   for (var i = 0; i < se_removed.length; i++){
      var shad = se_removed[i]
      var id   = shad.app_id
      var cid  = shad.cloudlet

      console.log("AAA se_type_updates_all", se_type_updates_all)
      console.log("AAA se_type_updates_app", se_type_updates_app)

      for ( var type_id in se_type_updates_all[shad.app_id] ){

         var permissions = {}
         permissions[id]  = se_type_updates_all[id][type_id]
         permissions[cid] = se_type_updates_all[id][type_id]

         console.log(">>>> C ", permissions)
         updateObjectPermissionsByType(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, false)
      }

      for ( var type_id in se_type_updates_app[shad.app_id] ){

         var permissions = {}
         permissions[id]  = se_type_updates_app[id][type_id]
         permissions[cid] = se_type_updates_app[id][type_id]

         console.log(">>>> V ", permissions)
         updateObjectPermissionsByType(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, true)
      }
   }


   //handle default
   for ( var type_id in type_updates_all ){

      var permissions = {}
      permissions[thirdPartyId]         = type_updates_all[type_id]
      permissions[third_party_cloudlet] = type_updates_all[type_id]


      for (var i = 0; i < se_shadow.length; i++){
         var shad = se_shadow[i]
         console.log(">>>> N" )
         permissions[shad.app_id]   = type_updates_all[type_id]
         permissions[shad.cloudlet] = type_updates_all[type_id]
      }

      console.log(">>>> B", type_id, permissions)

      updateObjectPermissionsByType(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, false)

   }

   for ( var type_id in type_updates_app ){

      var permissions = {}
      permissions[thirdPartyId]         = type_updates_app[type_id]
      permissions[third_party_cloudlet] = type_updates_app[type_id]

      for (var i = 0; i < se_shadow.length; i++){
         var shad = se_shadow[i]
         console.log("L")
         permissions[shad.app_id]   = type_updates_app[type_id]
         permissions[shad.cloudlet] = type_updates_app[type_id]
      }

      console.log(">>>> M", type_id, permissions)

      updateObjectPermissionsByType(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, true)
   }

   var funs = {}

   for ( var object_id in object_updates ){

      var permissions = {}
      permissions[thirdPartyId]         = object_updates[object_id]
      permissions[third_party_cloudlet] = object_updates[object_id]

      //for (var i = 0; i < se_shadow.length; i++){
      //   var shad = se_shadow[i]
      //
      //   console.log(">>>> b", shad)
      //
      //   permissions[shad.app_id]   = object_updates[object_id]
      //   permissions[shad.cloudlet] = object_updates[object_id]
      //}

      funs[i] = function(dbs, cloudlet_id, object_id, thirdPartyId, permissions, applevel){
         return function (callback) {

            console.log(">>>> c", thirdPartyId)
            updateObjectsPermission(dbs, cloudlet_id, object_id, thirdPartyId, permissions, applevel, callback)

         }
      }(dbs, cloudlet_id, object_id, thirdPartyId, permissions, false)
   }


   async.series(funs, function (err, results) {

      if (err) {
         loglet.error(err);
      }
      else{
         console.log("Finished Propogating")
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
                  loglet.info("Permissions have been propogated");
               })
            }
         });
      }
   });
}


var updateObjectPermissionsByType = function(couchbase, dbs, cloudlet_id, type_id, thirdPartyId, permissions, objects, applevel){

   //console.log("updateObjectPermissionsByType")
   var skey = [cloudlet_id, type_id]
   var ekey = [cloudlet_id, type_id + "^"]


   //applevel = true

   var ViewQuery = couchbase.ViewQuery;
   var query = ViewQuery.from('objects_views', 'object_by_type')
      .stale(ViewQuery.Update.BEFORE)
      .range(skey, ekey, true)
      .reduce(false)

   console.log(cloudlet_id, type_id, thirdPartyId, permissions, objects, applevel)

   dbs['objects'].query(query, function (err, res) {

      if (err){
         return
      }

      //console.log("updateObjectPermissionsByType: " + res.length)

      var funs = {}

      for (var i = 0; i < res.length; i ++){
         var object_id = res[i].value[1]

         if ( -1 === objects.indexOf(object_id) ){
            funs[i] = (function(dbs, cloudlet_id, object_id, thirdPartyId, permissions, applevel){
               return function (callback) {
                  console.log(">>>> a", permissions)
                  updateObjectsPermission(dbs, cloudlet_id, object_id, thirdPartyId, permissions, applevel, callback)
               }
            }(dbs, cloudlet_id, object_id, thirdPartyId, permissions, applevel))
         }
      }

      async.series(funs, function (err, results) {

         if (err) {
            loglet.error(err);
         }
         else{
            //console.log(results)
         }
      });

   })
}

var updateObjectsPermission = function(dbs, cloudlet_id, object_id, thirdPartyId, permissions, applevel, callback){

   var key = cloudlet_id + '+' + object_id

   console.log("updateObjectsPermission " + key)

   dbs['objects'].get(key, function (err, db_body) {

      if(err) {
         loglet.error(err);
         callback(null, "not found: " + key)
         return
      }

      if ( undefined === db_body.value._permissions ){
         db_body.value._permissions = {}
      }

      console.log("updateObjectsPermission > 1 key      " + key)
      console.log("updateObjectsPermission > 1 cas      " + db_body.cas)
      console.log("updateObjectsPermission > 1 applevel " + applevel)
      console.log("updateObjectsPermission > 1 db_body.value._permissions.created_by " + db_body.value._permissions.created_by_app)
      console.log("updateObjectsPermission > 1 thirdPartyId " + thirdPartyId)
      console.log("updateObjectsPermission > 1 db_body.value._permissions.created_by === thirdPartyId" + db_body.value._permissions.created_by_app === thirdPartyId)


      if ( !applevel || (applevel && db_body.value._permissions.created_by_app === thirdPartyId) ){

         console.log("updateObjectsPermission > 2 " + key)
         console.log("updateObjectsPermission > 2 " + permissions)

         for (var i in permissions){
            db_body.value._permissions[i] = permissions[i]
         }


         console.log("db_body.value._permissions ", db_body.value._permissions)
         console.log("permissions ", permissions)


         dbs['objects'].replace(key, db_body.value, {cas : db_body.cas}, function (err, result) {

            console.log("updateObjectsPermission > 3 " + key, thirdPartyId, applevel, permissions)

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

   //test

   propagatePermissions(couchbase, dbs, msg, db_body.value)
   return

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
         console.log("err", err)
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