(function() {
    
    function create(tag,options,styles) {
        options || (options = { });
        styles || (styles={});
      var el= geomap.document.createElement(tag);
      setOptions(el,options);
      setStyle(el,styles);
      return el;
    }

    function setStyle(element,options){
        for (var prop in options) {
            element.style[prop]=options[prop];
          }
    }

    function setOptions(element,options){
        for (var prop in options) {
            element[prop]=options[prop];
          }
    }

    function createHiDPICanvas(canvas,w, h, ratio) {

      var PIXEL_RATIO = (function () {
        var c = document.createElement("canvas"),
          ctx = c.getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx['webkitBackingStorePixelRatio'] ||
            ctx['mozBackingStorePixelRatio'] ||
            ctx['msBackingStorePixelRatio'] ||
            ctx['oBackingStorePixelRatio'] ||
            ctx['backingStorePixelRatio'] || 1;
    
        return dpr / bsr;
      })();
    
      if (!ratio) { ratio = PIXEL_RATIO; }
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
      return canvas;
    }
    
    function hasClass(elem, cls) {
      cls = cls || '';
      if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
      return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
    }
   
    function addClass(elem, cls){
      if(!hasClass(elem, cls)){
          elem.className += ' ' + cls;
      }
  }

  function removeClass(elem, cls){
    if(hasClass(elem, cls)){
        var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
        while(newClass.indexOf(' ' + cls + ' ') >= 0){
            newClass = newClass.replace(' ' + cls + ' ', ' ');
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
}

function formToJson(form) {
  var json = new Object();
  var inputs = form.getElementsByTagName("input"); // 取得所有DOM
  for (var index = 0; index < inputs.length; index++) { // 遍历DOM获取值
    var element = inputs[index];
    var key = element.name;
    var value="";
   
    if (element.type==='radio'){
      if(json[key] === undefined){
        json[key]="";
      }
      if(element.checked){
        value=element.value;
        json[key] = value;
      } 
    }else if(element.type === 'checkbox' ){
      if(json[key] === undefined){
        json[key]=[];
      }
      if(element.checked){
        value=element.value;
        json[key].push(value);
      } 
    }else if(element.type != 'button' && element.type != 'submit'){
      value = element.value;
      json[key] = value;
    }
        //checkbox应根据需求赋值为true/false或 1/0
    // json[key] = value // 利用 ES6 计算属性名为对象创建属性
  }

  var selectEl = form.getElementsByTagName("select"); // 取得所有DOM
  for (var index = 0; index < selectEl.length; index++) {
    var element = selectEl[index];
    var key = element.name;
    var i = element.selectedIndex;
    value = element.options[i].value;
    json[key] = value;
  }
  var textareas = form.getElementsByTagName("textarea"); // 思路同上
  for (var index = 0; index < textareas.length; index++) {
    var element = textareas[index];
    json[element.name] = element.value;
  }

  // console.log(JSON.stringify(json));
  return json;
} 

function tplToFormHtml(tpl,selected){
  var html="",selectObj={};
for(var i=0,k=tpl.length;i<k;i++){
    var form=tpl[i];
    if(form.name === selected){
      selectObj.form=form;
    for(var j=0,jn=form.properties.length;j<jn;j++){
    var pro=form.properties[j];
      if(pro.type === "text"){
          html+="<br><span style='min-width:100px;display: inline-block;text-align: right;padding: 4px;'>"+pro.title+"</span><input type='text' name='"+pro.id +"' value='"+ pro.value+"' />" ;
      }else if(pro.type === "hidden"){
          html+="<input type='hidden' name='"+pro.id +"' value='"+ pro.value+"' />" ;
      }else if(pro.type === "radio"){
          html+="<br><span style='min-width:100px;display: inline-block;text-align: right;padding: 4px;' >"+pro.title+"</span>";
          for(var option in pro.option){
              if(pro.value === pro.option[option]){
                  html+="<label><input type='radio' checked='checked' name='"+pro.id +"' value='"+option+"' >" +pro.option[option]+"</label>";
              }else{
                  html+="<label><input type='radio' name='"+pro.id +"' value='"+option+"' >" +pro.option[option]+"</label>";
              }
          }
          
      }else if(pro.type === "checkbox"){
          html+="<br><span style='min-width:100px;display: inline-block;text-align: right;padding: 4px;' >"+pro.title+"</span>";
          for(var option in pro.option){
              if(pro.value === pro.option[option]){
                  html+="<label><input type='checkbox' checked='checked' name='"+pro.id +"' value='"+option+"' >" +pro.option[option]+"</label>";
              }else{
                  html+="<label><input type='checkbox' name='"+pro.id +"' value='"+option+"' >" +pro.option[option]+"</label>";
              }
          }
          
      }else if(pro.type === "select"){
          html+="<br><span style='min-width:100px;display: inline-block;text-align: right;padding: 4px;' >"+pro.title+"</span>";
          html+="<select name='"+pro.id+"'>";
          if(pro.hasEmptyOption){
              html+="<option value='' >请选择</option>";
          }
          for(var option in pro.option){
              if(pro.value === pro.option[option]){
                  html+="<option selected='selected' value='"+option +"' >" +pro.option[option]+"</option>";
              }else{
                  html+="<option value='"+option +"' >" +pro.option[option]+"</option>";
              }
          }
          html+="</select>";
      }
        
    }
  }
}
selectObj.html=html;
return selectObj;

}

    geomap.element = {
      create: create,
      setStyle: setStyle,
      setOptions:setOptions,
      hasClass:hasClass,
      addClass:addClass,
      removeClass:removeClass,
      formToJson:formToJson,
      tplToFormHtml:tplToFormHtml,
      createHiDPICanvas:createHiDPICanvas
    };
   
  })();