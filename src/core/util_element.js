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

function parseToForm(form){
  var formId=form.id || ("form_"+ new Date());
  var root=geomap.element.create("form",{"id":formId},{"marginTop":"10px"});
  if(form.properties){
    // var form=formObj.form;
    var rowStyle={"height":"30px"};
    for(var j=0,jn=form.properties.length;j<jn;j++){
      var pro=form.properties[j];
      if(pro.type === "text"){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerText=pro.title;
        var input=geomap.element.create("input",{"type":"text","name":pro.id});
        input.value=pro.value;
        div.appendChild(layer);
        div.appendChild(input);
        root.appendChild(div);
      }else if(pro.type === 'hidden'){
        var input=geomap.element.create("input",{"type":"hidden","name":pro.id});
        input.value=pro.value;
        root.appendChild(input);
      }else if(pro.type === 'radio' || pro.type==='checkbox'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerText=pro.title;
        div.appendChild(layer);
        for(var option in pro.option){
            var label=geomap.element.create("label");
            var radio=geomap.element.create("input",{"type":pro.type,"name":pro.id});
            radio.value=option;
            var labelTxt=geomap.element.create("a");
            labelTxt.innerText=pro.option[option];
            label.appendChild(radio);
            label.appendChild(labelTxt);
            div.appendChild(label);
          if(pro.value === option){
            radio.checked=true;
          } 
        }
        root.appendChild(div); 
      }else if(pro.type==='select'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerText=pro.title;
        var selectObj=geomap.element.create("select",{"name":pro.id});
        for(var option in pro.option){
            var selOpt=geomap.element.create("option",{"type":'checkbox',"name":pro.id});
            selOpt.value=option;
            selOpt.innerText=pro.option[option]; 
            selectObj.appendChild(selOpt); 
          if(pro.value === pro.option[option]){
            radio.selected=true;
          } 
        }
        div.appendChild(layer);
        div.appendChild(selectObj);
        root.appendChild(div); 
      }else if(pro.type === 'button'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerHTML="&nbsp;";
        div.appendChild(layer);
        var btn=geomap.element.create("input",{"type":"button","className":"btn","name":pro.id});
        btn.value=pro.value;
        div.appendChild(btn);
        root.appendChild(div);
        if(pro.click){
          eventjs.add(btn,"click",pro.click);
        }
      }else if(pro.type === 'buttons'){
        var div=geomap.element.create("div",{},rowStyle);
        var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
        layer.innerHTML="&nbsp;";
        div.appendChild(layer);
        for(var i=0,k=pro.group.length;i<k;i++){
          var groupBtn=pro.group[i];
          var btn=geomap.element.create("input",{"type":"button","className":"btn","name":groupBtn.id});
          btn.value=groupBtn.value;
          div.appendChild(btn);
          if(groupBtn.click){
            eventjs.add(btn,"click",groupBtn.click);
          }
        }
        root.appendChild(div);
      }
    }
  }
  if(form.buttons){
    var div=geomap.element.create("div",{},rowStyle);
    var layer=geomap.element.create("span",{},{"minWidth":"100px","display": "inline-block","textAlign":"right"});
    layer.innerHTML="&nbsp;";
    div.appendChild(layer);
    for(var i=0,k=form.buttons.length;i<k;i++){
      var groupBtn=form.buttons[i];
      var btn=geomap.element.create("input",{"type":"button","className":"btn","name":groupBtn.id});
      btn.value=groupBtn.value;
      div.appendChild(btn);
      if(groupBtn.click){
        eventjs.add(btn,"click",groupBtn.click);
      }
    }
    root.appendChild(div); 
  }
  return root;
}
 

    geomap.element = {
      create: create,
      setStyle: setStyle,
      setOptions:setOptions,
      hasClass:hasClass,
      addClass:addClass,
      removeClass:removeClass,
      formToJson:formToJson,
      parseToForm:parseToForm,
      createHiDPICanvas:createHiDPICanvas
    };
   
  })();