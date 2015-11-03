# psd-extractor
extract font faces, sizes and colors from PSDs, accumulate and see their usage count.

> for example output see  [examples/extracted.json](https://github.com/safareli/psd-extractor/blob/master/examples/extracted.json)

##cli

> Usage: psd-extractor `<file ...>`

to extract data from PSDs in current directory (`*.psd`) run:

```
$ psd-extractor
``` 


or pass list of files as arguments: 
```
$ psd-extractor foo.psd pages/*.psd
```


##js

```javascript
var psdExtractor = require("psd-extractor")
var fooData = psdExtractor('foo.psd')
var pageData = psdExtractor('pages/*.psd')
var allData = psdExtractor(['foo.psd', 'pages/*.psd'])
```