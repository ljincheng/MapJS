(function(global) {

    'use strict';
   
  
    if (!global.geomap) {
      global.geomap = { };
    }
  
    if (global.geomap.DBStore) {
        geomap.warn('geomap.Image is already defined.');
      return;
    }
 
    geomap.DBStore=geomap.Class(geomap.CommonMethods, geomap.Observable,{
        type: 'DBStore',
        indexedDB:null,
        dbVersion:1.0,
        dbFile:"geomapFile",
        dbRequest:null,
        db:null, 
        openSuccess:false,
        openError:false,
        dbInitStatus:false,
        dbNames:["geomap"],
    initialize: function(options) {
          options || (options = { }); 
          this._setOptions(options);  
          
          var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
         // IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
          this.indexedDB=indexedDB;
          this.openStore();
    },
    createStore:function(event){
        console.log("Creating objectStore");
        var db = event.target.result;
      
        for(var i=0,k=this.dbNames.length;i<k;i++){
            var dbName=this.dbNames[i];
            if (!db.objectStoreNames.contains(dbName)) {
                db.createObjectStore(dbName);
            }
        }
        this.dbInitStatus=true;
    },
    openStore:function(){
        var request = this.indexedDB.open(this.dbFile, this.dbVersion);
        this.dbRequest=request;
        request.onerror =this.openStoreError.bind(this);
        request.onsuccess=this.openStoreSuccess.bind(this);
        request.onupgradeneeded = this.createStore.bind(this); 
    },
    openStoreError:function(event){
        console.log("Error creating/accessing IndexedDB database");
        this.openError=true;
        this.dbInitStatus=true;
        var myself=this;
        this.fire("open_error",myself);
    },
    openStoreSuccess:function(event){ 
        console.log("Success creating/accessing IndexedDB database");
        this.openSuccess=true;
        var request=this.dbRequest;
       var db = request.result;
       this.db=db;

    //    request.onupgradeneeded = this.createStore.bind(this);

        db.onerror = function (event) {
            console.log("Error creating/accessing IndexedDB database");
        };
        
        // Interim solution for Google Chrome to create an objectStore. Will be deprecated
        if (db.setVersion) {
            if (db.version != dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess =this.createStore.bind(this);
            }else{
                this.dbInitStatus=true;
            }
           
        }else{
            this.dbInitStatus=true;
        }
        var myself=this;
         this.fire("open_success",myself);
       
    },
    clearData:function(dbName){
        if(this.openSuccess){
            var transaction =this.db.transaction(dbName, "readwrite");
            var tranStore=transaction.objectStore(dbName);
            var clearRes=tranStore.clear();
           var myself=this;
            clearRes.onsuccess=function(e){
                myself.fire("clear_success",myself);
                geomap.log('表名['+dbName+']数据清理成功');
            }
        }
    },
    deleteDb:function(dbName){
        this.indexedDB.deleteDatabase(dbName);
    },
    putStore:function(dbName,key,data){
        if(this.openSuccess){
            try{
                var transaction =this.db.transaction(dbName, "readwrite");
                var tranStore=transaction.objectStore(dbName);
                tranStore.put(data,key);
                // this.getTranStore(this.dbName).put(data,key);
                return true;
            }catch(e){
                // throw new Error("保存数据库失败");
                geomap.log("保存数据库失败");
                geomap.warn(e);
                return false;
            }
        }
        return false;
    },

    getStore:function(dbName,key){
        if(this.openSuccess){
            try{
                var transaction =this.db.transaction(dbName, "readwrite");
                var tranStore=transaction.objectStore(dbName);
                return new Promise(function(resolve, reject) {
                    tranStore.get(key).onsuccess=resolve;
                });
            }catch(e){
                geomap.log("获取数据库数据失败");
                geomap.warn(e);
                // throw new Error("获取数据库数据失败");
            }
        }
        return null;
    }
   
	 
    });


    geomap.GlobalDBStore=function (dbNames,dbFile,dbVersion){
        if(dbFile==undefined){
            dbFile="geomap";
        }
        if(dbVersion==undefined){
            dbVersion=1.0;
        }
        if(!geomap._GLOBAL_DB_STORE){
            geomap._GLOBAL_DB_STORE={};
        }
        var key=dbFile;
        if(!geomap._GLOBAL_DB_STORE[key]){
            var dbStore=new geomap.DBStore({dbNames:dbNames,dbFile:dbFile,dbVersion:dbVersion});
            var _global_store= {dbStore:dbStore,open:false};
            geomap._GLOBAL_DB_STORE[key]= _global_store;
            dbStore.on("open_success",function(){
                _global_store.open=true; 
            });
        //      var res=dbStore.openStore();
        //      if(res!=null){
        //         res.then(function(resolve,reject){
        //             dbStore.openStoreSuccess(null);
        //            // dbStore.clearData();
        //             _global_store.open=true; 
        //         },function(event){
        //             dbStore.openStoreError(event);
        //         });
        //        }
   
           }
           return geomap._GLOBAL_DB_STORE[key];
    }
})(typeof exports !== 'undefined' ? exports : this);