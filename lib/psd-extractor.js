var glob = require("glob")
var R = require("ramda")
var PSD = require('psd');
var isGlob = require('is-glob');
var Color = require("color");

var metaAdder = R.curry(function(meta,data){
  return {
    data: data,
    meta: meta,
    map: function(f){
      return metaAdder(meta,f(data));
    },
    bind:function(f){
      return f(meta,data);
    }
  }
})


function concatReducer(acc,item){
  if(item.data.childless()){
    return acc.concat(item);
  }else{
    return acc.concat(item.bind(function(meta,layer){
      return layer.children().map(function(child){
        return metaAdder(meta,child)
      }).reduce(concatReducer, [])
    }));
  }
}

function extractLayerInfo(item){
  return {
    path: item.data.path(),
    file: item.meta,
    position:{
      top: item.data.get('top'),
      left: item.data.get('left'),
      right: item.data.get('right'),
      bottom: item.data.get('bottom'),
      width: item.data.get('width'),
      height: item.data.get('height')
    }
  }
}

function colorToString(c){
  return Color('rgb('+c.slice(0,3).join(',')+')').hslString();
}

function extractFontsFromTextLayer(item){
  var typeTool = item.data.get('typeTool');
  return {
    layerInfo: extractLayerInfo(item),
    fonts: R.uniq(R.difference(typeTool.fonts(),['AdobeInvisFont','MyriadPro-Regular'])),
    sizes: R.uniq(typeTool.sizes()),
    colors: R.uniq(typeTool.colors().map(colorToString))
  }
}

function unextractable(item){
  return {
    layerInfo: extractLayerInfo(item),
  }
}
function extractColorFromShape(item){
  return{
    layerInfo: extractLayerInfo(item),
    colors: [item.data.get('solidColor').color()].map(colorToString)
  }
}

var usageReducer = function(acc,item){
  if(!acc[item]){
    acc[item] = 0
  }
  acc[item] +=1;
  return acc;
}

function acumulator(acc,item){
  return R.mapObjIndexed(function(val,key){
    if(R.isArrayLike(item[key]) && !R.isEmpty(item[key])){
      return R.reduce(usageReducer, val, item[key]);
    }else{
      return val;
    }
  },acc);
}

var LayersfromPathes = R.reduce(function(acc,path){
  var psd = PSD.fromFile(path);
  psd.parse();
  var psdChildren = psd.tree().children()
  return R.concat(acc, psdChildren.map(metaAdder(path)));
}, []);


var flattenLayers = R.reduce(concatReducer, []);

var resolveGlobList = R.reduce(function(acc, path){
  return R.concat(acc, isGlob(path) ? glob.sync(path) : path);
}, []);

var globListToUniqPathes = R.compose(R.uniq, resolveGlobList);

var sortObjectByKeys = function(obj,key){
  var pairedObj = R.toPairs(obj);

  if(key == 'colors'){
    return R.sort(function(a, b) {
      a = Color(a[0]);
      b = Color(b[0]);
      if (a.hue() > b.hue() ) return 1;
      else if (a.hue() < b.hue() ) return -1;
      else if (a.saturation() > b.saturation() ) return 1;
      else if (a.saturation() < b.saturation() ) return -1;
      else if (a.lightness() > b.lightness() ) return 1;
      else if (a.lightness() < b.lightness() ) return -1;
      else return 0;
    }, pairedObj);
  }else if(key == 'sizes'){
    return R.sort(function (a,b){return a[0] - b[0] }, pairedObj)
  }else{
    return R.sortBy(R.prop(0), pairedObj)
  }
}


module.exports = function(pathes){
  if(!R.isArrayLike(pathes)){
    pathes = R.of(pathes);
  }

  var extractedData = flattenLayers(LayersfromPathes(globListToUniqPathes(pathes))).map(function(item){
    if(item.data.get('solidColor')){
      return extractColorFromShape(item);
    }else if(item.data.get('typeTool')){
      return extractFontsFromTextLayer(item);
    }else{
      return unextractable(item);
    }
  });
  var acumulatedData = R.mapObjIndexed(
    sortObjectByKeys,
    R.reduce(acumulator, {
      fonts:{},
      sizes:{},
      colors:{}
    }, extractedData)
  )

  return {
    acumulatedData: acumulatedData,
    allData: extractedData
  }
}