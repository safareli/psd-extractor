var glob = require("glob")
var R = require("ramda")
var PSD = require('psd');
var isGlob = require('is-glob');
function metaAdder(meta,data){
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
}

function getUnique(arr){
   var u = {}, a = [];
   for(var i = 0, l = arr.length; i < l; ++i){
      if(u.hasOwnProperty(arr[i])) {
         continue;
      }
      a.push(arr[i]);
      u[arr[i]] = 1;
   }
   return a;
}

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

function without(array, whatArray){
    return array.filter(function(el){ 
        return whatArray.reduce(function(acc,what){
          return acc ? what !== el : acc
        }, true);
    });
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
  return 'rgb('+c.slice(0,3).join(',')+')';
}

function extractFontsFromTextLayer(item){
  var typeTool = item.data.get('typeTool');
  return {
    layerInfo: extractLayerInfo(item),
    fonts: getUnique(without(typeTool.fonts(),['AdobeInvisFont','MyriadPro-Regular'])),
    sizes: getUnique(typeTool.sizes()),
    colors: getUnique(typeTool.colors().map(colorToString))
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

function acumulator(acc,item){
  if(item.fonts){
    item.fonts.forEach(function(font){
      if(!acc.fonts[font]){
        acc.fonts[font] = 0
      }
      acc.fonts[font] +=1;
    })
  }
  if(item.sizes){
    item.sizes.forEach(function(size){
      if(!acc.sizes[size]){
        acc.sizes[size] = 0
      }
      acc.sizes[size] +=1;
    })
  }
  if(item.colors){
    item.colors.forEach(function(color){
      if(!acc.colors[color]){
        acc.colors[color] = 0
      }
      acc.colors[color] +=1;
    })
  }
  return acc;
}

function LayersfromPathes(pathes){
  return pathes.reduce(function(acc,path){
    var psd = PSD.fromFile(path);
    psd.parse();
    return acc.concat(psd.tree().children().map(function(child){
      return metaAdder(path,child);
    }));
  },[])
}
function logAsJSON(obj){
  console.log(JSON.stringify(obj,null,4));
  return obj;
}

function flattenLayers(layers){
  return layers.reduce(concatReducer, [])
}


var resolveGlobList = R.reduce(function(acc, path){
  return R.concat(acc, isGlob(path) ? glob.sync(path) : path);
}, []);

var globListToUniqPathes = R.compose(R.uniq, resolveGlobList);

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

  return {
    acumulatedData: extractedData.reduce(acumulator, {
      fonts:{},
      sizes:{},
      colors:{}
    }),
    allData: extractedData
  }
}
