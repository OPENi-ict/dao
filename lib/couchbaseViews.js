/**
 * Created by dmccarthy on 22/08/2014.
 */
'use strict';

var logger = null;
var loglet      = require('loglet');
loglet = loglet.child({component: 'dao'});

var design_docs = {
   objects_views: {
      views: {
         object_by_cloudlet_id: {
            map: function(doc, meta) {
               var parts = meta.id.split('+');
               if(parts.length > 1) {
                  emit(parts[0], doc['@id']);
               }
            }
         },
         object_by_type: {
            map: function(doc, meta) {
               var parts = meta.id.split('+');
               if( parts.length > 1 ) {
                  emit( parts[0] + '+' + doc['@openi_type'], doc['@id'] );
               }
            }
         }
      }
   },
   cloudlets_views: {
      views: {
         cloudlet_list: {
            map: function(doc, meta) {
               var parts = meta.id.split('+');
               if(1 === parts.length) {
                  if(0 === parts[0].indexOf('c_')) {
                     emit(parts[0], doc['@id']);
                  }
               }
            }
         }
      }
   },
   type_views: {
      views: {
         types_list: {
            map: function(doc, meta) {
               var parts = meta.id.split('+');
               if (1 === parts.length) {
                  if (0 === parts[0].indexOf('t_')) {
                     emit(parts[0], doc['@id']);
                  }
               }
            }
         },
         types_usage: {
            map: function(doc, meta) {
               var parts = meta.id.split('+');
               if (parts.length > 1) {
                  emit(doc['@openi_type'], 1);
               }
            },
            reduce: '_count'
         }
      }
   },
   subscription_views: {
      views: {
         subs_by_objectId: {
            map: function (doc, meta) {
               if (meta.id.indexOf("+s_") !== -1) {
                  //var cloudlet = meta.id.split("+")[0]
                  emit(doc.objectid, doc);
               }
            }
         }
      }
   }
};


function createViewsForDesignDoc(db, localdocName, localdocValue) {

   db.getDesignDoc( localdocName, function( err, ddoc) {

      if(err) {
         loglet.error(err);
      }

      if ( null !== err && 4104 === err.code) {
         db.setDesignDoc( localdocName, localdocValue, function(err) {
            console.log(err);
            if(err) {
               loglet.error(err);
            }
            console.log("INFO", "Created Whole Design Doc: " + localdocName);
            logger.log("INFO", "Created Whole Design Doc: " + localdocName);
         });
      } else {
         for ( var i in localdocValue.views) {
            if(localdocValue.views.hasOwnProperty(i)) {
               if (!(i in ddoc['views'])) {
                  ddoc.views[i] = localdocValue.views[i];
                  db.setDesignDoc( localdocName, ddoc, function( err) {
                     if(err) {
                        loglet.error(err);
                     }
                     console.log("INFO", 'Create view ' + i + ' for Design Doc ' + localdocName );
                     logger.log("INFO", 'Create view ' + i + ' for Design Doc ' + localdocName );
                  });
               }
            }
         }
      }
   });
}


var createDesignDocs = function(db) {
   for (var i in design_docs) {
      if(design_docs.hasOwnProperty(i)) {
         createViewsForDesignDoc(db, i, design_docs[i]);
      }
   }
};


module.exports = function(db, loggerObj) {

   logger = loggerObj;

   //stringify all views map functions
   for (var i in design_docs ) {
      if(design_docs.hasOwnProperty(i)) {
         for (var j in design_docs[i]['views']) {
            if(design_docs[i]['views'].hasOwnProperty(j)) {
               design_docs[i]['views'][j].map    = '' + design_docs[i]['views'][j].map;
               if (undefined !== design_docs[i]['views'][j].reduce) {
                  design_docs[i]['views'][j].reduce = '' + design_docs[i]['views'][j].reduce;
               }
            }
         }
      }
   }

   createDesignDocs(db);
};
