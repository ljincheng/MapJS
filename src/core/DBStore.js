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
        dbName:"geomap",
        dbFile:"geomapFile",
        dbRequest:null,
        db:null,
        
        openSuccess:false,
        openError:false,
        dbInitStatus:false,
    initialize: function(options) {
          options || (options = { }); 
          this._setOptions(options);  
          
          var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
         // IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
          this.indexedDB=indexedDB;
         // this.openStore();
    },
    createStore:function(event){
        console.log("Creating objectStore");
        var db = event.target.result;
        // if (!db.objecttables.contains(this.dbName)) { //判断数据库中是否已经存在该名称的数据表
          db.createObjectStore(this.dbName); 
        // }
        // this.dbRequest.result.createObjectStore(this.dbName);
        this.dbInitStatus=true;
    },
    openStore:function(){
        if(this.dbRequest)
        {
            return null;
        }
        var request = this.indexedDB.open(this.dbFile, this.dbVersion);
        this.dbRequest=request;
        // request.onerror = function (event) {
        //         console.log("Error creating/accessing IndexedDB database");
        //         this.openError=true;
        //         this.dbInitStatus=true;
        //     }.bind(this);
        // request.onsuccess=this.openStoreSuccess.bind(this);
        request.onupgradeneeded = this.createStore.bind(this);

        var other=this;
        var res= new Promise(function(resolve, reject) {
            request.onsuccess=resolve;
            request.onerror=reject;
        });
        
        
       
    //    var nextRes= res.then(resolve=>function(event){
    //                 other.openStoreSuccess(event);
    //             }, reject=>function(event){
    //                 other.openStoreError(event);
    //             });
                return res;
    },
    openStoreError:function(event){
        console.log("Error creating/accessing IndexedDB database");
        this.openError=true;
        this.dbInitStatus=true;
    },
    openStoreSuccess:function(event){ 
        console.log("Success creating/accessing IndexedDB database");
        this.openSuccess=true;
        var request=this.dbRequest;
       var db = request.result;
       this.db=db;

       request.onupgradeneeded = this.createStore.bind(this);

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
       
       
    },
    getTranStore:function(dbName){

        if(!this._tranStore){
            this._tranStore={};
        }
        if(!this._tranStore[dbName]){
            var transaction =this.db.transaction(dbName, "readwrite");
            this._tranStore[dbName]= transaction.objectStore(dbName);
        }
        return this._tranStore[dbName];
    },
    deleteDb:function(dbName){
        this.indexedDB.deleteDatabase(dbName);
        this._tranStore[dbName]=null;
        delete this._tranStore[dbName];
    },
    putStore:function(key,data){
        if(this.openSuccess){
            this.getTranStore(this.dbName).put(data,key);
            return true;
        }
        return false;
    },

    getStore:function(key){
        if(this.openSuccess){
            var tranStore=this.getTranStore(this.dbName);
            var keyObj=tranStore.get(key);
            var res= new Promise(function(resolve, reject) {
                keyObj.onsuccess=resolve;
            });
            return res;
        }
        return null;
    }
   
	 
    });

})(typeof exports !== 'undefined' ? exports : this);